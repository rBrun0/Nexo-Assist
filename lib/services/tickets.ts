import "server-only";

import { randomBytes } from "node:crypto";
import { Priority, Prisma, TicketStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CreateTicketInput } from "@/lib/validations/ticket";
import { calculateSlaDeadline } from "@/lib/services/ticket-sla";

const ACTIVE_TICKET_STATUSES = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_ANALYST,
  TicketStatus.APPROVED,
];
const RECENTLY_RESOLVED_DAYS = 7;

const ANALYST_UPDATABLE_STATUSES = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_ANALYST,
  TicketStatus.APPROVED,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
] as const;

export class TicketInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TicketInputError";
  }
}

export async function listTicketsForUser(userId: string) {
  return prisma.ticket.findMany({
    where: {
      OR: [
        { createdById: userId },
        { affectedUsers: { some: { id: userId } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createTicketCommentForUser(
  userId: string,
  author: string,
  ticketCode: string,
  message: string
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      code: { equals: ticketCode, mode: "insensitive" },
      OR: [
        { createdById: userId },
        { affectedUsers: { some: { id: userId } } },
      ],
    },
    select: { id: true, code: true },
  });

  if (!ticket) {
    throw new TicketInputError("Chamado não encontrado na sua conta.");
  }

  await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      author,
      message,
    },
  });

  return { ticketCode: ticket.code };
}

type TicketWithAffected = Prisma.TicketGetPayload<{
  include: { affectedUsers: { select: { id: true } } };
}>;

export type CompatibleTicketMatch =
  | { match: "none" }
  | {
      match: "active";
      code: string;
      willLink: boolean;
      ticket: TicketWithAffected;
    }
  | {
      match: "reopen";
      code: string;
      ticket: TicketWithAffected;
    };

const TRANSIENT_PRISMA_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
  "P2034",
]);

export function isTransientDatabaseError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return TRANSIENT_PRISMA_CODES.has(String(error.code));
}

/** Lê chamado compatível sem gravar. A persistência continua em createTicketForUser. */
export async function findCompatibleTicket(
  userId: string,
  input: Pick<CreateTicketInput, "title" | "type" | "category">,
): Promise<CompatibleTicketMatch> {
  const matchingOpenTicket = await prisma.ticket.findFirst({
    where: {
      title: { equals: input.title, mode: "insensitive" },
      type: input.type,
      category: input.category,
      status: { in: ACTIVE_TICKET_STATUSES },
    },
    orderBy: { updatedAt: "desc" },
    include: { affectedUsers: { select: { id: true } } },
  });

  if (matchingOpenTicket) {
    return {
      match: "active",
      code: matchingOpenTicket.code,
      willLink: matchingOpenTicket.createdById !== userId,
      ticket: matchingOpenTicket,
    };
  }

  const recentResolutionDate = new Date();
  recentResolutionDate.setDate(
    recentResolutionDate.getDate() - RECENTLY_RESOLVED_DAYS,
  );
  const recentlyResolvedTicket = await prisma.ticket.findFirst({
    where: {
      createdById: userId,
      title: { equals: input.title, mode: "insensitive" },
      type: input.type,
      category: input.category,
      status: TicketStatus.RESOLVED,
      updatedAt: { gte: recentResolutionDate },
    },
    orderBy: { updatedAt: "desc" },
    include: { affectedUsers: { select: { id: true } } },
  });

  if (recentlyResolvedTicket) {
    return {
      match: "reopen",
      code: recentlyResolvedTicket.code,
      ticket: recentlyResolvedTicket,
    };
  }

  return { match: "none" };
}

export async function createTicketForUser(
  userId: string,
  input: CreateTicketInput
) {
  // Self-service: nunca aceitar affectedUserIds do cliente.
  const affectedUserIds = [userId];
  const found = await findCompatibleTicket(userId, input);

  if (found.match === "active") {
    const matchingOpenTicket = found.ticket;
    const allAffectedUserIds = [
      ...new Set([
        ...matchingOpenTicket.affectedUsers.map((user) => user.id),
        ...affectedUserIds,
      ]),
    ];

    if (found.willLink) {
      const priority =
        allAffectedUserIds.length > 1
          ? Priority.CRITICAL
          : matchingOpenTicket.priority;
      await prisma.ticket.update({
        where: { id: matchingOpenTicket.id },
        data: {
          priority,
          slaDeadline: calculateSlaDeadline(priority),
          isOverdue: false,
          affectedUsers: {
            set: allAffectedUserIds.map((id) => ({ id })),
          },
        },
      });

      return { outcome: "linked" as const, ticket: null };
    }

    const priority =
      allAffectedUserIds.length > 1 ? Priority.CRITICAL : input.priority;
    const ticket = await prisma.ticket.update({
      where: { id: matchingOpenTicket.id },
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        category: input.category,
        priority,
        slaDeadline: calculateSlaDeadline(priority),
        isOverdue: false,
        affectedUsers: {
          set: allAffectedUserIds.map((id) => ({ id })),
        },
      },
    });

    return { ticket, outcome: "updated" as const };
  }

  if (found.match === "reopen") {
    const recentlyResolvedTicket = found.ticket;
    const allAffectedUserIds = [
      ...new Set([
        ...recentlyResolvedTicket.affectedUsers.map((user) => user.id),
        userId,
      ]),
    ];
    const priority =
      allAffectedUserIds.length > 1 ? Priority.CRITICAL : input.priority;

    const ticket = await prisma.ticket.update({
      where: { id: recentlyResolvedTicket.id },
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        category: input.category,
        priority,
        slaDeadline: calculateSlaDeadline(priority),
        isOverdue: false,
        status: TicketStatus.OPEN,
        affectedUsers: {
          set: allAffectedUserIds.map((id) => ({ id })),
        },
      },
    });

    return { ticket, outcome: "reopened" as const };
  }

  const codePrefix = input.type === "INCIDENT" ? "INC" : "REQ";
  const code = `${codePrefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
  const ticket = await prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      priority: input.priority,
      slaDeadline: calculateSlaDeadline(input.priority),
      isOverdue: false,
      code,
      createdById: userId,
      affectedUsers: {
        connect: [{ id: userId }],
      },
    },
  });

  return { ticket, outcome: "created" as const };
}

const RETRY_DELAYS_MS = [200, 500];

export async function createTicketForUserWithRetry(
  userId: string,
  input: CreateTicketInput,
  options?: {
    attempts?: number;
    sleep?: (ms: number) => Promise<void>;
  },
) {
  const attempts = options?.attempts ?? 3;
  const sleep =
    options?.sleep ??
    ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await createTicketForUser(userId, input);
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === attempts - 1) {
        throw error;
      }
      await sleep(RETRY_DELAYS_MS[attempt] ?? 500);
    }
  }

  throw lastError;
}

type TicketClient = Prisma.TransactionClient | typeof prisma;

/** Marca o chamado como aguardando analista (transferência do ticket). */
export async function transferTicketToAnalyst(
  ticketId: string,
  client: TicketClient = prisma,
) {
  const updated = await client.ticket.updateMany({
    where: {
      id: ticketId,
      status: {
        in: [
          TicketStatus.OPEN,
          TicketStatus.IN_PROGRESS,
          TicketStatus.APPROVED,
          TicketStatus.WAITING_ANALYST,
        ],
      },
    },
    data: { status: TicketStatus.WAITING_ANALYST },
  });

  if (updated.count === 0) {
    return null;
  }

  return client.ticket.findUnique({ where: { id: ticketId } });
}

/** Atualiza o status de um chamado na fila do service desk. */
export async function updateTicketStatusForAnalyst(
  ticketId: string,
  status: TicketStatus,
) {
  if (
    !(ANALYST_UPDATABLE_STATUSES as readonly TicketStatus[]).includes(status)
  ) {
    throw new TicketInputError("Status de chamado inválido.");
  }

  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new TicketInputError("Chamado não encontrado.");
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      ...(status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED
        ? { isOverdue: false }
        : {}),
    },
  });
}
