import "server-only";

import {
  ChatStatus,
  MessageSender,
  Prisma,
  Role,
  TicketStatus,
} from "@prisma/client";

import { CONVERSATION_MESSAGE_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { isTicketOverdue } from "@/lib/services/ticket-sla";
import {
  createTicketForUser,
  transferTicketToAnalyst,
} from "@/lib/services/tickets";
import { ticketDraftSchema } from "@/lib/validations/ticket";

export { CONVERSATION_MESSAGE_LIMIT };

const ACTIVE_CHAT_STATUSES = [
  ChatStatus.BOT_ACTIVE,
  ChatStatus.WAITING_HUMAN,
  ChatStatus.HUMAN_ACTIVE,
];

/** Fila do analista: ativas + encerradas (detalhe “Resolvida pelo …” no pen.dev). */
const ANALYST_QUEUE_CHAT_STATUSES = [
  ...ACTIVE_CHAT_STATUSES,
  ChatStatus.CLOSED,
];

const countableMessageWhere = {
  sender: { not: MessageSender.SYSTEM },
} satisfies Prisma.ChatMessageWhereInput;

const analystTicketSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  status: true,
  slaDeadline: true,
  isOverdue: true,
  updatedAt: true,
} satisfies Prisma.TicketSelect;

const analystConversationInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      job: true,
      tickets: {
        select: analystTicketSelect,
        orderBy: { updatedAt: "desc" },
      },
      affectedTickets: {
        select: analystTicketSelect,
        orderBy: { updatedAt: "desc" },
      },
    },
  },
  assignedAnalyst: { select: { id: true, name: true } },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      senderUser: { select: { id: true, name: true, role: true, job: true } },
    },
  },
  ticket: {
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
    },
  },
  _count: {
    select: {
      messages: {
        where: {
          sender: MessageSender.EMPLOYEE,
          readAtByAnalyst: null,
        },
      },
    },
  },
} satisfies Prisma.ChatSessionInclude;

async function countCountableMessages(
  chatSessionId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return client.chatMessage.count({
    where: { chatSessionId, ...countableMessageWhere },
  });
}

async function createSystemMessage(
  chatSessionId: string,
  content: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
  createdAt = new Date(),
) {
  return client.chatMessage.create({
    data: {
      chatSessionId,
      sender: MessageSender.SYSTEM,
      content,
      createdAt,
      readAtByEmployee: createdAt,
      readAtByAnalyst: createdAt,
    },
  });
}

type AnalystTicketRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  slaDeadline: Date | null;
  isOverdue: boolean;
  updatedAt: Date;
};

function mergeEmployeeTickets(
  created: AnalystTicketRow[],
  affected: AnalystTicketRow[],
) {
  const byId = new Map<string, AnalystTicketRow>();
  for (const ticket of [...created, ...affected]) {
    if (!byId.has(ticket.id)) byId.set(ticket.id, ticket);
  }
  return [...byId.values()]
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .map((ticket) => ({
      id: ticket.id,
      code: ticket.code,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      isOverdue: isTicketOverdue(ticket.slaDeadline, ticket.isOverdue),
      updatedAt: ticket.updatedAt.toISOString(),
    }));
}

export class ConversationError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "ConversationError";
  }
}

export async function getChatHistoryForUser(
  userId: string,
  role: Role,
  sessionId: string,
) {
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      ...(role === Role.EMPLOYEE ? { userId } : {}),
    },
    select: { id: true },
  });
  if (!session) {
    throw new ConversationError(
      "Conversa não encontrada ou sem permissão.",
      404,
    );
  }

  await prisma.chatMessage.updateMany({
    where: {
      chatSessionId: session.id,
      sender:
        role === Role.EMPLOYEE
          ? { in: [MessageSender.ASSISTANT, MessageSender.ANALYST] }
          : MessageSender.EMPLOYEE,
      ...(role === Role.EMPLOYEE
        ? { readAtByEmployee: null }
        : { readAtByAnalyst: null }),
    },
    data:
      role === Role.EMPLOYEE
        ? { readAtByEmployee: new Date() }
        : { readAtByAnalyst: new Date() },
  });

  const messages = await prisma.chatMessage.findMany({
    where: { chatSessionId: session.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      senderUser: { select: { id: true, name: true, role: true, job: true } },
    },
  });
  return messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
    readAtByEmployee: message.readAtByEmployee?.toISOString() ?? null,
    readAtByAnalyst: message.readAtByAnalyst?.toISOString() ?? null,
  }));
}

/** Busca a conversa ativa do funcionário sem criar uma nova. */
export async function findActiveEmployeeConversation(userId: string) {
  return prisma.chatSession.findFirst({
    where: { userId, status: { in: ACTIVE_CHAT_STATUSES } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getOrCreateEmployeeConversation(userId: string) {
  const existing = await findActiveEmployeeConversation(userId);
  if (existing) return existing;

  try {
    return await prisma.chatSession.create({ data: { userId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const concurrentSession = await findActiveEmployeeConversation(userId);
      if (concurrentSession) return concurrentSession;
    }

    throw error;
  }
}

/** Retorna a conversa ativa com histórico, ou null se ainda não houver sessão. */
export async function getEmployeeConversation(userId: string) {
  const session = await findActiveEmployeeConversation(userId);
  if (!session) {
    return null;
  }

  await prisma.chatMessage.updateMany({
    where: {
      chatSessionId: session.id,
      sender: { in: [MessageSender.ASSISTANT, MessageSender.ANALYST] },
      readAtByEmployee: null,
    },
    data: { readAtByEmployee: new Date() },
  });

  const [conversation, messageCount] = await Promise.all([
    prisma.chatSession.findUniqueOrThrow({
      where: { id: session.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            senderUser: {
              select: { id: true, name: true, role: true, job: true },
            },
          },
        },
        ticket: true,
      },
    }),
    countCountableMessages(session.id),
  ]);

  return {
    ...conversation,
    messageCount,
    messageLimit: CONVERSATION_MESSAGE_LIMIT,
  };
}

export async function createEmployeeMessage(
  userId: string,
  content: string,
  selectedTicketId?: string,
) {
  const session = await getOrCreateEmployeeConversation(userId);

  if (session.status === ChatStatus.CLOSED) {
    throw new ConversationError("Esta conversa foi encerrada.", 409);
  }

  if (selectedTicketId) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: selectedTicketId,
        OR: [
          { createdById: userId },
          { affectedUsers: { some: { id: userId } } },
        ],
      },
      select: { id: true },
    });
    if (!ticket) {
      throw new ConversationError("Chamado selecionado não encontrado.", 404);
    }
  }

  if (session.status !== ChatStatus.BOT_ACTIVE) {
    const message = await sendManualConversationMessage(
      userId,
      Role.EMPLOYEE,
      session.id,
      content,
    );
    return { session, message, shouldRunAgent: false };
  }

  const message = await prisma.$transaction(async (transaction) => {
    const activeSession = await transaction.chatSession.findFirst({
      where: {
        id: session.id,
        userId,
        status: ChatStatus.BOT_ACTIVE,
      },
      select: { id: true },
    });
    if (!activeSession) {
      throw new ConversationError(
        "O estado da conversa mudou. Atualize e tente novamente.",
        409,
      );
    }

    const messageCount = await countCountableMessages(
      session.id,
      transaction,
    );
    if (messageCount + 2 > CONVERSATION_MESSAGE_LIMIT) {
      throw new ConversationError(
        "Esta conversa atingiu o limite de 30 mensagens. Solicite um analista para continuar.",
        409,
      );
    }

    const createdMessage = await transaction.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: MessageSender.EMPLOYEE,
        senderUserId: userId,
        content,
        readAtByEmployee: new Date(),
        metadata: selectedTicketId ? { selectedTicketId } : Prisma.JsonNull,
      },
    });
    await transaction.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });
    return createdMessage;
  });

  return { session, message, shouldRunAgent: true };
}

export async function sendManualConversationMessage(
  actorId: string,
  actorRole: Role,
  sessionId: string,
  content: string,
) {
  return prisma.$transaction(async (transaction) => {
    const session = await transaction.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        status: true,
        assignedAnalystId: true,
      },
    });

    if (!session || session.status === ChatStatus.CLOSED) {
      throw new ConversationError("Conversa não encontrada ou encerrada.", 404);
    }

    const sender =
      actorRole === Role.ANALYST
        ? MessageSender.ANALYST
        : MessageSender.EMPLOYEE;
    const isAllowedEmployee =
      actorRole === Role.EMPLOYEE &&
      session.userId === actorId &&
      (session.status === ChatStatus.WAITING_HUMAN ||
        session.status === ChatStatus.HUMAN_ACTIVE);
    const isAssignedAnalyst =
      actorRole === Role.ANALYST &&
      session.status === ChatStatus.HUMAN_ACTIVE &&
      session.assignedAnalystId === actorId;

    if (!isAllowedEmployee && !isAssignedAnalyst) {
      throw new ConversationError(
        actorRole === Role.ANALYST
          ? "A conversa precisa estar atribuída a você para responder."
          : "Mensagens manuais só podem ser enviadas durante o atendimento humano.",
        403,
      );
    }

    const messageCount = await countCountableMessages(sessionId, transaction);
    if (messageCount >= CONVERSATION_MESSAGE_LIMIT) {
      throw new ConversationError(
        "Esta conversa atingiu o limite de 30 mensagens.",
        409,
      );
    }

    const now = new Date();
    const allowedSession = await transaction.chatSession.updateMany({
      where: {
        id: sessionId,
        status: session.status,
        ...(actorRole === Role.EMPLOYEE
          ? { userId: actorId }
          : { assignedAnalystId: actorId }),
      },
      data: { updatedAt: now },
    });
    if (allowedSession.count !== 1) {
      throw new ConversationError(
        "O estado ou responsável pela conversa mudou. Atualize e tente novamente.",
        409,
      );
    }

    return transaction.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        sender,
        senderUserId: actorId,
        content,
        ...(actorRole === Role.EMPLOYEE
          ? { readAtByEmployee: now }
          : { readAtByAnalyst: now }),
      },
    });
  });
}

export async function markSessionWaitingHuman(
  sessionId: string,
  userId: string,
  reason: string,
) {
  const now = new Date();
  const summary = reason.slice(0, 2000);
  const updated = await prisma.chatSession.updateMany({
    where: {
      id: sessionId,
      userId,
      status: ChatStatus.BOT_ACTIVE,
    },
    data: {
      status: ChatStatus.WAITING_HUMAN,
      assignedAnalystId: null,
      handoffSummary: summary,
      handoffReason: summary,
      handoffAt: now,
      updatedAt: now,
    },
  });

  if (updated.count !== 1) {
    const current = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: ChatStatus.WAITING_HUMAN,
      },
      select: { id: true },
    });
    return { applied: false, alreadyWaiting: Boolean(current) };
  }

  await createSystemMessage(
    sessionId,
    "Transferida para suporte N2",
    prisma,
    now,
  );
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { ticketId: true },
  });
  if (session?.ticketId) {
    await transferTicketToAnalyst(session.ticketId);
  }

  return { applied: true, alreadyWaiting: false };
}

export async function saveAssistantMessage(
  sessionId: string,
  content: string,
  thoughtProcess: Prisma.InputJsonValue,
  metadata: Prisma.InputJsonValue | undefined,
  {
    confidenceScore,
    handoffSummary,
    handoffReason,
  }: {
    confidenceScore: number;
    handoffSummary?: string;
    handoffReason?: string;
  },
) {
  return prisma.$transaction(async (transaction) => {
    const now = new Date();
    const updatedSession = await transaction.chatSession.updateMany({
      where: { id: sessionId, status: ChatStatus.BOT_ACTIVE },
      data: {
        confidenceScore,
        ...(handoffSummary
          ? {
              status: ChatStatus.WAITING_HUMAN,
              assignedAnalystId: null,
              handoffSummary: handoffSummary.slice(0, 2000),
              handoffReason: (handoffReason ?? handoffSummary).slice(0, 2000),
              handoffAt: now,
            }
          : {}),
        updatedAt: now,
      },
    });
    if (updatedSession.count !== 1) {
      if (!handoffSummary) {
        throw new ConversationError(
          "A conversa mudou de estado antes da resposta do agente ser salva.",
          409,
        );
      }
      const current = await transaction.chatSession.findUnique({
        where: { id: sessionId },
        select: { status: true },
      });
      if (current?.status !== ChatStatus.WAITING_HUMAN) {
        throw new ConversationError(
          "A conversa mudou de estado antes da resposta do agente ser salva.",
          409,
        );
      }
      const kept = await transaction.chatSession.updateMany({
        where: { id: sessionId, status: ChatStatus.WAITING_HUMAN },
        data: { confidenceScore, updatedAt: now },
      });
      if (kept.count !== 1) {
        throw new ConversationError(
          "A conversa mudou de estado antes da resposta do agente ser salva.",
          409,
        );
      }
      return transaction.chatMessage.create({
        data: {
          chatSessionId: sessionId,
          sender: MessageSender.ASSISTANT,
          content,
          thoughtProcess,
          metadata,
          readAtByEmployee: new Date(),
        },
      });
    }

    const message = await transaction.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        sender: MessageSender.ASSISTANT,
        content,
        thoughtProcess,
        metadata,
        readAtByEmployee: new Date(),
      },
    });

    if (handoffSummary) {
      await createSystemMessage(
        sessionId,
        "Transferida para suporte N2",
        transaction,
        now,
      );
      const session = await transaction.chatSession.findUnique({
        where: { id: sessionId },
        select: { ticketId: true },
      });
      if (session?.ticketId) {
        await transferTicketToAnalyst(session.ticketId, transaction);
      }
    }

    return message;
  });
}

export async function requestAnalystHandoff(
  userId: string,
  reason = "Funcionário solicitou atendimento humano.",
) {
  const session = await getOrCreateEmployeeConversation(userId);

  if (session.status === ChatStatus.CLOSED) {
    throw new ConversationError("Esta conversa foi encerrada.", 409);
  }

  if (
    session.status === ChatStatus.WAITING_HUMAN ||
    session.status === ChatStatus.HUMAN_ACTIVE
  ) {
    const current = await getEmployeeConversation(userId);
    if (!current) {
      throw new ConversationError("Conversa não encontrada.", 404);
    }
    return current;
  }

  const now = new Date();
  const summary = reason.slice(0, 2000);
  const updated = await prisma.chatSession.updateMany({
    where: {
      id: session.id,
      userId,
      status: ChatStatus.BOT_ACTIVE,
    },
    data: {
      status: ChatStatus.WAITING_HUMAN,
      assignedAnalystId: null,
      handoffSummary: summary,
      handoffReason: summary,
      handoffAt: now,
      updatedAt: now,
    },
  });

  if (updated.count !== 1) {
    throw new ConversationError(
      "O estado da conversa mudou. Atualize e tente novamente.",
      409,
    );
  }

  await createSystemMessage(
    session.id,
    "Transferida para suporte N2",
    prisma,
    now,
  );
  if (session.ticketId) {
    await transferTicketToAnalyst(session.ticketId);
  }

  const conversation = await getEmployeeConversation(userId);
  if (!conversation) {
    throw new ConversationError("Conversa não encontrada.", 404);
  }
  return conversation;
}

export async function getEmployeeTicketsForAgent(userId: string) {
  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { createdById: userId },
        { affectedUsers: { some: { id: userId } } },
      ],
    },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      type: true,
      category: true,
      priority: true,
      status: true,
      slaDeadline: true,
      isOverdue: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return tickets.map((ticket) => ({
    ...ticket,
    isOverdue: isTicketOverdue(ticket.slaDeadline, ticket.isOverdue),
  }));
}

export async function createTicketFromDraft(
  userId: string,
  draftMessageId: string,
) {
  const session = await getOrCreateEmployeeConversation(userId);
  const messageCount = await countCountableMessages(session.id);
  if (messageCount + 2 > CONVERSATION_MESSAGE_LIMIT) {
    throw new ConversationError(
      "Não há espaço para confirmar nesta conversa.",
      409,
    );
  }

  const draftMessage = await prisma.chatMessage.findFirst({
    where: {
      id: draftMessageId,
      chatSessionId: session.id,
      sender: MessageSender.ASSISTANT,
    },
    select: { id: true, metadata: true },
  });
  if (
    !draftMessage ||
    !draftMessage.metadata ||
    typeof draftMessage.metadata !== "object"
  ) {
    throw new ConversationError("Rascunho de chamado não encontrado.", 404);
  }

  const metadata = draftMessage.metadata as Record<string, unknown>;
  if (metadata.kind !== "ticket_draft") {
    throw new ConversationError(
      "Esta mensagem não contém um rascunho de chamado.",
      400,
    );
  }
  if (metadata.confirmed === true) {
    throw new ConversationError("Este rascunho já foi confirmado.", 409);
  }
  if (metadata.cancelled === true) {
    throw new ConversationError("Este rascunho foi cancelado.", 409);
  }

  const draft = ticketDraftSchema.safeParse({
    ...(typeof metadata.draft === "object" && metadata.draft !== null
      ? metadata.draft
      : {}),
    affectedUserIds: [userId],
  });
  if (!draft.success) {
    throw new ConversationError("O rascunho não é mais válido.", 400);
  }

  const confirmedAt = new Date().toISOString();
  const claimed = await prisma.$executeRaw`
    UPDATE "ChatMessage"
    SET metadata = ${JSON.stringify({
      ...metadata,
      draft: draft.data,
      confirmed: true,
      confirmedAt,
    })}::jsonb
    WHERE id = ${draftMessageId}
      AND "chatSessionId" = ${session.id}
      AND sender = 'ASSISTANT'
      AND COALESCE(metadata->>'confirmed', 'false') <> 'true'
      AND COALESCE(metadata->>'cancelled', 'false') <> 'true'
  `;
  if (Number(claimed) !== 1) {
    throw new ConversationError("Este rascunho já foi confirmado.", 409);
  }

  const workflowRunId =
    typeof metadata.workflowRunId === "string" ? metadata.workflowRunId : "";
  const result = workflowRunId
    ? await (async () => {
        const { resumeOpenTicketRun } = await import(
          "@/lib/mastra/resume-open-ticket"
        );
        const resumed = await resumeOpenTicketRun(workflowRunId, true);
        if (resumed.cancelled || !resumed.outcome) {
          throw new ConversationError("Não foi possível gravar o chamado.", 502);
        }
        return { ticket: resumed.ticket, outcome: resumed.outcome };
      })()
    : await createTicketForUser(userId, {
        ...draft.data,
        confirmed: true,
      });

  const responseContent = !result.ticket
    ? "Pronto, registrei você como também afetado pelo chamado existente e atualizei a prioridade."
    : `Chamado ${result.ticket.code} ${result.outcome === "reopened" ? "reaberto" : result.outcome === "updated" ? "atualizado" : "criado"} com sucesso.`;

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: MessageSender.EMPLOYEE,
        senderUserId: userId,
        content: "Confirmei o rascunho do chamado.",
        readAtByEmployee: new Date(),
        metadata: { action: "confirm_ticket", draftMessageId },
      },
    }),
    prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: MessageSender.ASSISTANT,
        content: responseContent,
        thoughtProcess: {
          actions: [
            {
              name: result.outcome,
              label: "Registrou o chamado após sua confirmação",
            },
          ],
          confidence: "high",
          rationale:
            "O rascunho foi confirmado explicitamente pelo funcionário.",
        },
        metadata: result.ticket
          ? {
              kind: "ticket",
              ticketId: result.ticket.id,
              ticketCode: result.ticket.code,
            }
          : { kind: "ticket_linked" },
        readAtByEmployee: new Date(),
      },
    }),
  ]);
  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      ticketId: result.ticket?.id ?? session.ticketId,
      updatedAt: new Date(),
    },
  });

  const confirmedPriority = result.ticket?.priority ?? draft.data.priority;
  if (confirmedPriority === "CRITICAL" && result.ticket) {
    if (session.status === ChatStatus.BOT_ACTIVE) {
      await requestAnalystHandoff(
        userId,
        `Chamado ${result.ticket.code} classificado como crítico.`,
      );
    } else if (session.status === ChatStatus.WAITING_HUMAN) {
      await transferTicketToAnalyst(result.ticket.id);
    }
  }

  return {
    outcome: result.outcome,
    ticket: result.ticket,
    messages: [userMessage, assistantMessage],
  };
}

export async function cancelTicketDraft(
  userId: string,
  draftMessageId: string,
) {
  const session = await getOrCreateEmployeeConversation(userId);
  const messageCount = await countCountableMessages(session.id);
  if (messageCount + 2 > CONVERSATION_MESSAGE_LIMIT) {
    throw new ConversationError(
      "Não há espaço para cancelar nesta conversa.",
      409,
    );
  }

  const draftMessage = await prisma.chatMessage.findFirst({
    where: {
      id: draftMessageId,
      chatSessionId: session.id,
      sender: MessageSender.ASSISTANT,
    },
    select: { id: true, metadata: true },
  });
  if (
    !draftMessage ||
    !draftMessage.metadata ||
    typeof draftMessage.metadata !== "object"
  ) {
    throw new ConversationError("Rascunho de chamado não encontrado.", 404);
  }

  const metadata = draftMessage.metadata as Record<string, unknown>;
  if (metadata.kind !== "ticket_draft") {
    throw new ConversationError(
      "Esta mensagem não contém um rascunho de chamado.",
      400,
    );
  }
  if (metadata.confirmed === true) {
    throw new ConversationError("Este rascunho já foi confirmado.", 409);
  }
  if (metadata.cancelled === true) {
    throw new ConversationError("Este rascunho já foi cancelado.", 409);
  }

  const cancelledAt = new Date().toISOString();
  const claimed = await prisma.$executeRaw`
    UPDATE "ChatMessage"
    SET metadata = ${JSON.stringify({
      ...metadata,
      cancelled: true,
      cancelledAt,
    })}::jsonb
    WHERE id = ${draftMessageId}
      AND "chatSessionId" = ${session.id}
      AND sender = 'ASSISTANT'
      AND COALESCE(metadata->>'confirmed', 'false') <> 'true'
      AND COALESCE(metadata->>'cancelled', 'false') <> 'true'
  `;
  if (Number(claimed) !== 1) {
    throw new ConversationError("Este rascunho já foi cancelado.", 409);
  }

  const workflowRunId =
    typeof metadata.workflowRunId === "string" ? metadata.workflowRunId : "";
  if (workflowRunId) {
    try {
      const { resumeOpenTicketRun } = await import(
        "@/lib/mastra/resume-open-ticket"
      );
      await resumeOpenTicketRun(workflowRunId, false);
    } catch (error) {
      console.error("Falha ao encerrar o workflow do rascunho:", error);
    }
  }

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: MessageSender.EMPLOYEE,
        senderUserId: userId,
        content: "Cancelei o rascunho do chamado.",
        readAtByEmployee: new Date(),
        metadata: { action: "cancel_ticket", draftMessageId },
      },
    }),
    prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: MessageSender.ASSISTANT,
        content: "Rascunho cancelado. Nenhum chamado foi aberto.",
        thoughtProcess: {
          actions: [
            {
              name: "cancel_ticket",
              label: "Cancelou o rascunho sem persistir chamado",
            },
          ],
          confidence: "high",
          rationale: "O funcionário cancelou o rascunho explicitamente.",
        },
        metadata: { kind: "options", options: [] },
        readAtByEmployee: new Date(),
      },
    }),
  ]);
  await prisma.chatSession.update({
    where: { id: session.id },
    data: { updatedAt: new Date() },
  });

  return { messages: [userMessage, assistantMessage] };
}

export async function listAnalystConversations() {
  // Ativas + encerradas com mensagem: vazias de login ficam de fora;
  // encerradas alimentam “Resolvida pelo agente/analista” em Todas.
  const sessions = await prisma.chatSession.findMany({
    where: {
      status: { in: ANALYST_QUEUE_CHAT_STATUSES },
      messages: { some: {} },
    },
    include: analystConversationInclude,
    orderBy: { updatedAt: "desc" },
  });

  return sessions.map(({ _count, messages, user, ticket, ...session }) => {
    const { tickets, affectedTickets, ...userRest } = user;
    return {
      ...session,
      handoffAt: session.handoffAt?.toISOString() ?? null,
      closedAt: session.closedAt?.toISOString() ?? null,
      user: {
        ...userRest,
        tickets: mergeEmployeeTickets(tickets, affectedTickets),
      },
      ticket,
      messages: messages.reverse().map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
        readAtByEmployee: message.readAtByEmployee?.toISOString() ?? null,
        readAtByAnalyst: message.readAtByAnalyst?.toISOString() ?? null,
      })),
      unreadCount: _count.messages,
    };
  });
}

export async function getAnalystConversation(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      ...analystConversationInclude,
      ticket: {
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          type: true,
          category: true,
          priority: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!session) return null;

  const { _count, messages, user, ticket, ...conversation } = session;
  const { tickets, affectedTickets, ...userRest } = user;
  return {
    ...conversation,
    handoffAt: conversation.handoffAt?.toISOString() ?? null,
    closedAt: conversation.closedAt?.toISOString() ?? null,
    user: {
      ...userRest,
      tickets: mergeEmployeeTickets(tickets, affectedTickets),
    },
    ticket,
    messages: messages.reverse().map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAtByEmployee: message.readAtByEmployee?.toISOString() ?? null,
      readAtByAnalyst: message.readAtByAnalyst?.toISOString() ?? null,
    })),
    unreadCount: _count.messages,
  };
}

async function clearAnalystUnread(sessionId: string) {
  await prisma.chatMessage.updateMany({
    where: {
      chatSessionId: sessionId,
      sender: MessageSender.EMPLOYEE,
      readAtByAnalyst: null,
    },
    data: { readAtByAnalyst: new Date() },
  });
}

export async function markConversationReadByAnalyst(
  sessionId: string,
  analystId: string,
) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { assignedAnalystId: true },
  });
  if (!session || session.assignedAnalystId !== analystId) {
    return;
  }

  await clearAnalystUnread(sessionId);
}

export async function performAnalystConversationAction(
  analystId: string,
  sessionId: string,
  action:
    | { action: "claim" }
    | { action: "return_to_bot" }
    | { action: "close" }
    | { action: "send_message"; message: string },
) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      assignedAnalystId: true,
      ticketId: true,
    },
  });
  if (!session || session.status === ChatStatus.CLOSED) {
    throw new ConversationError(
      "Conversa não encontrada ou já encerrada.",
      404,
    );
  }

  if (action.action === "claim") {
    if (
      session.status === ChatStatus.HUMAN_ACTIVE &&
      session.assignedAnalystId === analystId
    ) {
      await markConversationReadByAnalyst(sessionId, analystId);
      return { status: ChatStatus.HUMAN_ACTIVE };
    }

    if (session.status !== ChatStatus.WAITING_HUMAN) {
      throw new ConversationError(
        "Esta conversa não está aguardando ou já foi assumida por outro analista.",
        409,
      );
    }

    const analyst = await prisma.user.findUnique({
      where: { id: analystId },
      select: { name: true },
    });
    const now = new Date();
    const claimed = await prisma.chatSession.updateMany({
      where: {
        id: sessionId,
        status: ChatStatus.WAITING_HUMAN,
        assignedAnalystId: null,
      },
      data: {
        status: ChatStatus.HUMAN_ACTIVE,
        assignedAnalystId: analystId,
        updatedAt: now,
      },
    });
    if (claimed.count !== 1) {
      throw new ConversationError(
        "Outro analista assumiu esta conversa. Atualize a fila.",
        409,
      );
    }
    await createSystemMessage(
      sessionId,
      `${analyst?.name ?? "Analista"} assumiu — agent pausado`,
      prisma,
      now,
    );
    if (session.ticketId) {
      await prisma.ticket.updateMany({
        where: {
          id: session.ticketId,
          status: {
            in: [
              TicketStatus.OPEN,
              TicketStatus.WAITING_ANALYST,
              TicketStatus.APPROVED,
            ],
          },
        },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }
    await clearAnalystUnread(sessionId);
    return { status: ChatStatus.HUMAN_ACTIVE };
  }

  if (action.action === "return_to_bot") {
    const now = new Date();
    const clearHandoffData = {
      status: ChatStatus.BOT_ACTIVE,
      assignedAnalystId: null,
      handoffSummary: null,
      handoffReason: null,
      handoffAt: null,
      confidenceScore: null,
      updatedAt: now,
    };

    if (session.status === ChatStatus.WAITING_HUMAN) {
      const returned = await prisma.chatSession.updateMany({
        where: {
          id: sessionId,
          status: ChatStatus.WAITING_HUMAN,
          assignedAnalystId: null,
        },
        data: clearHandoffData,
      });
      if (returned.count !== 1) {
        throw new ConversationError(
          "A conversa foi atualizada por outra pessoa. Atualize os dados antes de tentar novamente.",
          409,
        );
      }
      await createSystemMessage(
        sessionId,
        "Devolvida ao Nexo Assist",
        prisma,
        now,
      );
      return { status: ChatStatus.BOT_ACTIVE };
    }

    if (
      session.status !== ChatStatus.HUMAN_ACTIVE ||
      session.assignedAnalystId !== analystId
    ) {
      throw new ConversationError(
        "A conversa precisa estar atribuída a você.",
        403,
      );
    }

    const returned = await prisma.chatSession.updateMany({
      where: {
        id: sessionId,
        status: ChatStatus.HUMAN_ACTIVE,
        assignedAnalystId: analystId,
      },
      data: clearHandoffData,
    });
    if (returned.count !== 1) {
      throw new ConversationError(
        "A conversa foi atualizada por outra pessoa. Atualize os dados antes de tentar novamente.",
        409,
      );
    }
    await createSystemMessage(
      sessionId,
      "Devolvida ao Nexo Assist",
      prisma,
      now,
    );
    return { status: ChatStatus.BOT_ACTIVE };
  }

  if (
    session.assignedAnalystId !== analystId ||
    session.status !== ChatStatus.HUMAN_ACTIVE
  ) {
    throw new ConversationError(
      "A conversa precisa estar atribuída a você.",
      403,
    );
  }

  if (action.action === "close") {
    const now = new Date();
    const closed = await prisma.chatSession.updateMany({
      where: {
        id: sessionId,
        status: ChatStatus.HUMAN_ACTIVE,
        assignedAnalystId: analystId,
      },
      data: { status: ChatStatus.CLOSED, closedAt: now, updatedAt: now },
    });
    if (closed.count !== 1) {
      throw new ConversationError(
        "A conversa foi atualizada por outra pessoa. Atualize os dados antes de tentar novamente.",
        409,
      );
    }
    await createSystemMessage(sessionId, "Conversa encerrada", prisma, now);
    return { status: ChatStatus.CLOSED };
  }

  const message = await sendManualConversationMessage(
    analystId,
    Role.ANALYST,
    sessionId,
    action.message,
  );
  return { status: ChatStatus.HUMAN_ACTIVE, message };
}

export const openTicketStatuses = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_ANALYST,
  TicketStatus.APPROVED,
];
