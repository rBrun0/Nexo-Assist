import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  Priority,
  TicketCategory,
  TicketStatus,
  TicketType,
} from "@prisma/client";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    ticket: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    ticketComment: {
      create: jest.fn(),
    },
  },
}));
jest.mock("@/lib/services/ticket-sla", () => ({
  calculateSlaDeadline: jest.fn(() => new Date("2026-11-10T18:00:00.000Z")),
}));

import { prisma } from "@/lib/prisma";
import {
  createTicketCommentForUser,
  createTicketForUser,
  listTicketsForUser,
  TicketInputError,
  transferTicketToAnalyst,
  updateTicketStatusForAnalyst,
} from "./tickets";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";

const baseInput = {
  title: "VPN corporativa fora",
  description: "Não consigo autenticar na VPN desde a manhã.",
  type: TicketType.INCIDENT,
  category: TicketCategory.NETWORK_VPN,
  priority: Priority.HIGH,
  affectedUserIds: [userId, otherUserId],
  confirmed: true as const,
};

function resolveMock(mock: unknown, value: unknown) {
  (
    mock as { mockResolvedValue: (resolvedValue: unknown) => unknown }
  ).mockResolvedValue(value);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listTicketsForUser", () => {
  it("lista tickets criados ou em que o usuário é afetado", async () => {
    resolveMock(prisma.ticket.findMany, []);
    await listTicketsForUser(userId);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { createdById: userId },
            { affectedUsers: { some: { id: userId } } },
          ],
        },
      })
    );
  });
});

describe("createTicketForUser", () => {
  it("ignora affectedUserIds do cliente e cria só com o usuário autenticado", async () => {
    resolveMock(prisma.ticket.findFirst, null);
    resolveMock(prisma.ticket.create, {
      id: "ticket-1",
      code: "INC-ABCDEF",
      createdById: userId,
      priority: Priority.HIGH,
    });

    const result = await createTicketForUser(userId, baseInput);

    expect(result.outcome).toBe("created");
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: userId,
          priority: Priority.HIGH,
          affectedUsers: { connect: [{ id: userId }] },
        }),
      })
    );
  });

  it("vincula o usuário a ticket ativo de terceiros sem devolver detalhes", async () => {
    resolveMock(prisma.ticket.findFirst, {
      id: "ticket-other",
      createdById: otherUserId,
      priority: Priority.MEDIUM,
      affectedUsers: [{ id: otherUserId }],
    });
    resolveMock(prisma.ticket.update, { id: "ticket-other" });

    const result = await createTicketForUser(userId, baseInput);

    expect(result).toEqual({ outcome: "linked", ticket: null });
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-other" },
        data: expect.objectContaining({
          priority: Priority.CRITICAL,
          affectedUsers: {
            set: [{ id: otherUserId }, { id: userId }],
          },
        }),
      })
    );
  });

  it("trata APPROVED como chamado ativo compatível", async () => {
    resolveMock(prisma.ticket.findFirst, {
      id: "ticket-approved",
      createdById: userId,
      priority: Priority.LOW,
      affectedUsers: [{ id: userId }],
    });
    resolveMock(prisma.ticket.update, {
      id: "ticket-approved",
      code: "INC-APPROVED",
    });

    const result = await createTicketForUser(userId, {
      ...baseInput,
      priority: Priority.MEDIUM,
    });

    expect(result.outcome).toBe("updated");
    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: [
              TicketStatus.OPEN,
              TicketStatus.IN_PROGRESS,
              TicketStatus.WAITING_ANALYST,
              TicketStatus.APPROVED,
            ],
          },
        }),
      })
    );
  });

  it("reabre ticket RESOLVED recente do próprio usuário", async () => {
    resolveMockOnceOpenNullThenResolved();
    resolveMock(prisma.ticket.update, {
      id: "ticket-resolved",
      code: "INC-RESOLVED",
      status: TicketStatus.OPEN,
    });

    const result = await createTicketForUser(userId, baseInput);
    expect(result.outcome).toBe("reopened");
    expect(result.ticket).toMatchObject({ id: "ticket-resolved" });
  });
});

describe("transferTicketToAnalyst", () => {
  it("marca o chamado como WAITING_ANALYST", async () => {
    resolveMock(prisma.ticket.updateMany, { count: 1 });
    resolveMock(prisma.ticket.findUnique, {
      id: "ticket-1",
      status: TicketStatus.WAITING_ANALYST,
    });

    await expect(transferTicketToAnalyst("ticket-1")).resolves.toMatchObject({
      status: TicketStatus.WAITING_ANALYST,
    });
    expect(prisma.ticket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "ticket-1" }),
        data: { status: TicketStatus.WAITING_ANALYST },
      }),
    );
  });
});

describe("updateTicketStatusForAnalyst", () => {
  it("atualiza o status quando o chamado existe", async () => {
    resolveMock(prisma.ticket.findUnique, {
      id: "ticket-1",
      status: TicketStatus.WAITING_ANALYST,
    });
    resolveMock(prisma.ticket.update, {
      id: "ticket-1",
      status: TicketStatus.IN_PROGRESS,
    });

    await expect(
      updateTicketStatusForAnalyst("ticket-1", TicketStatus.IN_PROGRESS),
    ).resolves.toMatchObject({ status: TicketStatus.IN_PROGRESS });
  });

  it("rejeita chamado inexistente", async () => {
    resolveMock(prisma.ticket.findUnique, null);
    await expect(
      updateTicketStatusForAnalyst("missing", TicketStatus.RESOLVED),
    ).rejects.toBeInstanceOf(TicketInputError);
  });
});

describe("createTicketCommentForUser", () => {
  it("permite comentar em ticket criado ou vinculado", async () => {
    resolveMock(prisma.ticket.findFirst, { id: "ticket-1", code: "INC-1" });
    resolveMock(prisma.ticketComment.create, { id: "comment-1" });

    await expect(
      createTicketCommentForUser(userId, "carlos@nexo.com", "INC-1", "Detalhe extra")
    ).resolves.toEqual({ ticketCode: "INC-1" });
  });

  it("rejeita comentário em ticket de terceiros", async () => {
    resolveMock(prisma.ticket.findFirst, null);
    await expect(
      createTicketCommentForUser(userId, "carlos@nexo.com", "INC-X", "oi")
    ).rejects.toBeInstanceOf(TicketInputError);
  });
});

function resolveMockOnceOpenNullThenResolved() {
  const findFirst = jest.mocked(prisma.ticket.findFirst);
  findFirst.mockResolvedValueOnce(null as never);
  findFirst.mockResolvedValueOnce({
    id: "ticket-resolved",
    createdById: userId,
    priority: Priority.HIGH,
    affectedUsers: [{ id: userId }],
  } as never);
}
