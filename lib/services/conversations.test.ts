import { beforeEach, describe, expect, it } from "@jest/globals";
import { ChatStatus, MessageSender, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTicketForUser } from "@/lib/services/tickets";
import {
  ConversationError,
  createEmployeeMessage,
  cancelTicketDraft,
  createTicketFromDraft,
  findActiveEmployeeConversation,
  getChatHistoryForUser,
  getEmployeeConversation,
  getOrCreateEmployeeConversation,
  performAnalystConversationAction,
  saveAssistantMessage,
  sendManualConversationMessage,
  listAnalystConversations,
} from "./conversations";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    chatSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    chatMessage: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    ticket: { findFirst: jest.fn(), updateMany: jest.fn() },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}));
jest.mock("@/lib/services/tickets", () => ({
  createTicketForUser: jest.fn(),
  transferTicketToAnalyst: jest.fn(),
}));

const transactionMock = {
  chatSession: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  chatMessage: {
    count: jest.fn(),
    create: jest.fn(),
  },
  ticket: {
    updateMany: jest.fn(),
  },
};

const analystId = "analyst-1";
const employeeId = "employee-1";
const sessionId = "session-1";

function resolveMock(mock: unknown, value: unknown) {
  (
    mock as { mockResolvedValue: (resolvedValue: unknown) => unknown }
  ).mockResolvedValue(value);
}

function resolveMockOnce(mock: unknown, value: unknown) {
  (
    mock as { mockResolvedValueOnce: (resolvedValue: unknown) => unknown }
  ).mockResolvedValueOnce(value);
}

function setSession(
  status: ChatStatus,
  assignedAnalystId: string | null = null,
  userId = employeeId,
  ticketId: string | null = null,
) {
  resolveMock(prisma.chatSession.findUnique, {
    id: sessionId,
    status,
    assignedAnalystId,
    userId,
    ticketId,
  });
}

function setTransactionSession(
  status: ChatStatus,
  assignedAnalystId: string | null = null,
  userId = employeeId,
) {
  resolveMock(transactionMock.chatSession.findUnique, {
    id: sessionId,
    status,
    assignedAnalystId,
    userId,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.$transaction).mockImplementation(((operation: unknown) => {
    if (typeof operation === "function") {
      return operation(transactionMock);
    }
    if (Array.isArray(operation)) {
      return Promise.all(operation);
    }
    throw new Error("Formato de transação não suportado no mock.");
  }) as never);
});

describe("getChatHistoryForUser", () => {
  it("marca mensagens recebidas como lidas e serializa as datas", async () => {
    resolveMock(prisma.chatSession.findFirst, { id: sessionId });
    resolveMock(prisma.chatMessage.updateMany, { count: 1 });
    resolveMock(prisma.chatMessage.findMany, [
      {
        id: "message-1",
        sender: MessageSender.ASSISTANT,
        content: "Olá.",
        createdAt: new Date("2026-11-07T12:00:00.000Z"),
        readAtByEmployee: null,
        readAtByAnalyst: null,
        senderUser: null,
      },
    ]);

    const messages = await getChatHistoryForUser(
      employeeId,
      Role.EMPLOYEE,
      sessionId,
    );

    expect(messages[0].createdAt).toBe("2026-11-07T12:00:00.000Z");
    expect(prisma.chatSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: sessionId, userId: employeeId },
      }),
    );
    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sender: { in: [MessageSender.ASSISTANT, MessageSender.ANALYST] },
          readAtByEmployee: null,
        }),
        data: expect.objectContaining({ readAtByEmployee: expect.any(Date) }),
      }),
    );
  });

  it("não expõe histórico a funcionário sem acesso à sessão", async () => {
    resolveMock(prisma.chatSession.findFirst, null);

    await expect(
      getChatHistoryForUser(employeeId, Role.EMPLOYEE, sessionId),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.chatMessage.findMany).not.toHaveBeenCalled();
  });

  it("permite ao analista consultar histórico sem filtro por funcionário", async () => {
    resolveMock(prisma.chatSession.findFirst, { id: sessionId });
    resolveMock(prisma.chatMessage.updateMany, { count: 1 });
    resolveMock(prisma.chatMessage.findMany, []);

    await expect(
      getChatHistoryForUser(analystId, Role.ANALYST, sessionId),
    ).resolves.toEqual([]);
    expect(prisma.chatSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: sessionId } }),
    );
    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sender: MessageSender.EMPLOYEE,
          readAtByAnalyst: null,
        }),
        data: expect.objectContaining({ readAtByAnalyst: expect.any(Date) }),
      }),
    );
  });
});

describe("findActiveEmployeeConversation / getEmployeeConversation", () => {
  it("não cria sessão ao apenas consultar", async () => {
    resolveMock(prisma.chatSession.findFirst, null);

    await expect(findActiveEmployeeConversation(employeeId)).resolves.toBeNull();
    await expect(getEmployeeConversation(employeeId)).resolves.toBeNull();
    expect(prisma.chatSession.create).not.toHaveBeenCalled();
  });

  it("retorna a conversa ativa existente com contagem de mensagens", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.chatMessage.updateMany, { count: 0 });
    resolveMock(prisma.chatSession.findUniqueOrThrow, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
      messages: [],
      ticket: null,
    });
    resolveMock(prisma.chatMessage.count, 2);

    await expect(getEmployeeConversation(employeeId)).resolves.toMatchObject({
      id: sessionId,
      messageCount: 2,
      messageLimit: 30,
    });
    expect(prisma.chatSession.create).not.toHaveBeenCalled();
  });
});

describe("getOrCreateEmployeeConversation", () => {
  it("reusa a conversa ativa existente", async () => {
    const existing = { id: sessionId, status: ChatStatus.BOT_ACTIVE };
    resolveMock(prisma.chatSession.findFirst, existing);

    await expect(getOrCreateEmployeeConversation(employeeId)).resolves.toBe(
      existing,
    );
    expect(prisma.chatSession.create).not.toHaveBeenCalled();
  });

  it("cria uma conversa quando o funcionário ainda não tem uma ativa", async () => {
    resolveMock(prisma.chatSession.findFirst, null);
    const created = { id: sessionId, status: ChatStatus.BOT_ACTIVE };
    resolveMock(prisma.chatSession.create, created);

    await expect(getOrCreateEmployeeConversation(employeeId)).resolves.toBe(
      created,
    );
    expect(prisma.chatSession.create).toHaveBeenCalledWith({
      data: { userId: employeeId },
    });
  });
});

describe("listAnalystConversations", () => {
  it("lista só conversas ativas que já têm mensagem", async () => {
    const activeUpdatedAt = new Date("2026-11-07T18:00:00.000Z");
    resolveMock(prisma.chatSession.findMany, [
      {
        id: "active-1",
        status: ChatStatus.WAITING_HUMAN,
        updatedAt: activeUpdatedAt,
        createdAt: activeUpdatedAt,
        handoffAt: activeUpdatedAt,
        closedAt: null,
        handoffSummary: null,
        handoffReason: null,
        confidenceScore: 40,
        assignedAnalystId: null,
        user: {
          id: employeeId,
          name: "Funcionário",
          email: "employee@nexo.com",
          job: "Financeiro",
          tickets: [],
          affectedTickets: [],
        },
        assignedAnalyst: null,
        messages: [
          {
            id: "m1",
            sender: MessageSender.SYSTEM,
            content: "Transferida para suporte N2",
            createdAt: activeUpdatedAt,
            readAtByEmployee: activeUpdatedAt,
            readAtByAnalyst: activeUpdatedAt,
            senderUser: null,
          },
        ],
        ticket: null,
        _count: { messages: 0 },
      },
    ]);

    const conversations = await listAnalystConversations();

    expect(conversations.map(({ id }) => id)).toEqual(["active-1"]);
    expect(conversations[0]).toMatchObject({
      status: ChatStatus.WAITING_HUMAN,
      confidenceScore: 40,
      handoffAt: activeUpdatedAt.toISOString(),
    });
    expect(prisma.chatSession.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.chatSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: expect.any(Array) },
          messages: { some: {} },
        },
      }),
    );
  });
});

describe("createEmployeeMessage", () => {
  it("aciona o agente para mensagem numa conversa BOT_ACTIVE", async () => {
    const session = { id: sessionId, status: ChatStatus.BOT_ACTIVE };
    resolveMock(prisma.chatSession.findFirst, session);
    resolveMock(transactionMock.chatSession.findFirst, { id: sessionId });
    resolveMock(transactionMock.chatMessage.count, 1);
    resolveMock(transactionMock.chatMessage.create, {
      id: "employee-message",
      chatSessionId: sessionId,
      sender: MessageSender.EMPLOYEE,
    });
    resolveMock(transactionMock.chatSession.update, session);

    await expect(
      createEmployeeMessage(employeeId, "Meu notebook está lento."),
    ).resolves.toMatchObject({
      session,
      shouldRunAgent: true,
      message: { sender: MessageSender.EMPLOYEE },
    });
    expect(transactionMock.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sender: MessageSender.EMPLOYEE,
          senderUserId: employeeId,
          content: "Meu notebook está lento.",
        }),
      }),
    );
  });

  it("envia mensagem manual sem executar agente durante o handoff", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.WAITING_HUMAN,
    });
    resolveMock(prisma.chatMessage.count, 1);
    setTransactionSession(ChatStatus.WAITING_HUMAN);
    resolveMock(transactionMock.chatMessage.count, 2);
    resolveMock(transactionMock.chatSession.updateMany, { count: 1 });
    resolveMock(transactionMock.chatMessage.create, {
      id: "employee-message",
      chatSessionId: sessionId,
      sender: MessageSender.EMPLOYEE,
      senderUserId: employeeId,
    });

    await expect(
      createEmployeeMessage(employeeId, "Ainda preciso de ajuda."),
    ).resolves.toMatchObject({
      shouldRunAgent: false,
      message: { sender: MessageSender.EMPLOYEE },
    });
  });

  it("rejeita ticket selecionado que não pertence ao funcionário", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.ticket.findFirst, null);

    await expect(
      createEmployeeMessage(
        employeeId,
        "Quero atualizar este chamado.",
        "ticket-2",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.chatMessage.count).not.toHaveBeenCalled();
  });

  it("aplica o limite de mensagens antes de persistir uma nova interação", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(transactionMock.chatSession.findFirst, { id: sessionId });
    resolveMock(transactionMock.chatMessage.count, 29);

    await expect(
      createEmployeeMessage(employeeId, "Mensagem adicional."),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(transactionMock.chatMessage.create).not.toHaveBeenCalled();
  });
});

describe("saveAssistantMessage", () => {
  it("salva a resposta do agente e atualiza a sessão na mesma transação", async () => {
    resolveMock(transactionMock.chatSession.updateMany, { count: 1 });
    resolveMock(transactionMock.chatMessage.create, {
      id: "assistant-message-1",
      chatSessionId: sessionId,
      sender: MessageSender.ASSISTANT,
      content: "Encontrei uma orientação.",
    });

    await expect(
      saveAssistantMessage(
        sessionId,
        "Encontrei uma orientação.",
        { actions: [], confidence: "medium", rationale: "Sem alteração." },
        { options: [] },
        { confidenceScore: 85 },
      ),
    ).resolves.toMatchObject({ sender: MessageSender.ASSISTANT });
    expect(transactionMock.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: sessionId, status: ChatStatus.BOT_ACTIVE },
      }),
    );
    expect(transactionMock.chatMessage.create).toHaveBeenCalled();
  });

  it("transfere para a fila humana atomicamente com a resposta final do agente", async () => {
    const { transferTicketToAnalyst } = jest.requireMock(
      "@/lib/services/tickets",
    ) as { transferTicketToAnalyst: jest.Mock };
    resolveMock(transactionMock.chatSession.updateMany, { count: 1 });
    resolveMock(transactionMock.chatSession.findUnique, {
      ticketId: "ticket-1",
    });
    resolveMock(transactionMock.chatMessage.create, {
      id: "assistant-message-2",
      chatSessionId: sessionId,
      sender: MessageSender.ASSISTANT,
      content: "Estou encaminhando para um analista.",
    });
    resolveMock(transferTicketToAnalyst, {
      id: "ticket-1",
      status: "WAITING_ANALYST",
    });

    await saveAssistantMessage(
      sessionId,
      "Estou encaminhando para um analista.",
      {
        actions: [],
        confidence: "low",
        rationale: "Solicitou atendimento humano.",
      },
      { options: [] },
      {
        confidenceScore: 40,
        handoffSummary: "Falha geral de acesso.",
        handoffReason:
          "A busca na Central de Ajuda não encontrou artigos relevantes.",
      },
    );

    expect(transactionMock.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: sessionId, status: ChatStatus.BOT_ACTIVE },
        data: expect.objectContaining({
          status: ChatStatus.WAITING_HUMAN,
          assignedAnalystId: null,
          handoffSummary: "Falha geral de acesso.",
          handoffReason:
            "A busca na Central de Ajuda não encontrou artigos relevantes.",
          handoffAt: expect.any(Date),
          confidenceScore: 40,
        }),
      }),
    );
    expect(transactionMock.chatMessage.create).toHaveBeenCalledTimes(2);
    expect(transactionMock.chatMessage.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          sender: MessageSender.SYSTEM,
          content: "Transferida para suporte N2",
        }),
      }),
    );
    expect(transferTicketToAnalyst).toHaveBeenCalledWith(
      "ticket-1",
      transactionMock,
    );
  });

  it("não grava resposta se o estado mudou e limita o resumo de handoff", async () => {
    resolveMock(transactionMock.chatSession.updateMany, { count: 0 });

    await expect(
      saveAssistantMessage(
        sessionId,
        "Resposta.",
        { actions: [], confidence: "low", rationale: "Handoff." },
        undefined,
        {
          confidenceScore: 40,
          handoffSummary: "x".repeat(2500),
        },
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(transactionMock.chatMessage.create).not.toHaveBeenCalled();
    expect(transactionMock.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          handoffSummary: "x".repeat(2000),
          handoffReason: "x".repeat(2000),
        }),
      }),
    );
  });
});

describe("performAnalystConversationAction", () => {
  it("permite ao analista assumir uma conversa aguardando", async () => {
    setSession(ChatStatus.WAITING_HUMAN, null, employeeId, "ticket-1");
    resolveMock(prisma.user.findUnique, { name: "Rafael Lima" });
    resolveMock(prisma.chatSession.updateMany, { count: 1 });
    resolveMock(prisma.chatMessage.create, { id: "system-claim" });
    resolveMock(prisma.chatMessage.updateMany, { count: 2 });
    resolveMock(prisma.ticket.updateMany, { count: 1 });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).resolves.toEqual({ status: ChatStatus.HUMAN_ACTIVE });
    expect(prisma.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: sessionId,
          status: ChatStatus.WAITING_HUMAN,
          assignedAnalystId: null,
        },
        data: expect.objectContaining({
          status: ChatStatus.HUMAN_ACTIVE,
          assignedAnalystId: analystId,
        }),
      }),
    );
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sender: MessageSender.SYSTEM,
          content: "Rafael Lima assumiu — agent pausado",
        }),
      }),
    );
    expect(prisma.ticket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "ticket-1" }),
        data: { status: "IN_PROGRESS" },
      }),
    );
    expect(prisma.chatMessage.updateMany).toHaveBeenCalled();
  });

  it("trata uma segunda tentativa de assumir pelo mesmo analista como idempotente", async () => {
    setSession(ChatStatus.HUMAN_ACTIVE, analystId);
    resolveMock(prisma.chatMessage.updateMany, { count: 0 });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).resolves.toEqual({ status: ChatStatus.HUMAN_ACTIVE });
    expect(prisma.chatSession.updateMany).not.toHaveBeenCalled();
  });

  it("impede assumir conversa ativa no agente ou já atribuída a outro analista", async () => {
    setSession(ChatStatus.BOT_ACTIVE);
    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    setSession(ChatStatus.HUMAN_ACTIVE, "analyst-2");
    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("detecta a corrida quando outro analista assume primeiro", async () => {
    setSession(ChatStatus.WAITING_HUMAN);
    resolveMock(prisma.user.findUnique, { name: "Rafael Lima" });
    resolveMock(prisma.chatSession.updateMany, { count: 0 });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("devolve a conversa ao agente e remove a atribuição humana", async () => {
    setSession(ChatStatus.HUMAN_ACTIVE, analystId);
    resolveMock(prisma.chatSession.updateMany, { count: 1 });
    resolveMock(prisma.chatMessage.create, { id: "system-return" });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "return_to_bot",
      }),
    ).resolves.toEqual({ status: ChatStatus.BOT_ACTIVE });
    expect(prisma.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: sessionId,
          status: ChatStatus.HUMAN_ACTIVE,
          assignedAnalystId: analystId,
        },
        data: expect.objectContaining({
          status: ChatStatus.BOT_ACTIVE,
          assignedAnalystId: null,
          handoffSummary: null,
        }),
      }),
    );
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sender: MessageSender.SYSTEM,
          content: "Devolvida ao Nexo Assist",
        }),
      }),
    );
  });

  it("devolve ao agente uma conversa que ainda aguarda atendimento humano", async () => {
    setSession(ChatStatus.WAITING_HUMAN);
    resolveMock(prisma.chatSession.updateMany, { count: 1 });
    resolveMock(prisma.chatMessage.create, { id: "system-return-waiting" });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "return_to_bot",
      }),
    ).resolves.toEqual({ status: ChatStatus.BOT_ACTIVE });
    expect(prisma.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: sessionId,
          status: ChatStatus.WAITING_HUMAN,
          assignedAnalystId: null,
        },
        data: expect.objectContaining({
          status: ChatStatus.BOT_ACTIVE,
          assignedAnalystId: null,
          handoffSummary: null,
        }),
      }),
    );
  });

  it("não permite devolver ou encerrar uma conversa de outro analista", async () => {
    setSession(ChatStatus.HUMAN_ACTIVE, "analyst-2");
    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "return_to_bot",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "close",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.chatSession.updateMany).not.toHaveBeenCalled();
  });

  it("detecta uma alteração concorrente ao devolver a conversa", async () => {
    setSession(ChatStatus.HUMAN_ACTIVE, analystId);
    resolveMock(prisma.chatSession.updateMany, { count: 0 });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "return_to_bot",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("encerra uma conversa somente quando ela continua atribuída ao analista", async () => {
    setSession(ChatStatus.HUMAN_ACTIVE, analystId);
    resolveMock(prisma.chatSession.updateMany, { count: 1 });
    resolveMock(prisma.chatMessage.create, { id: "system-close" });

    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "close",
      }),
    ).resolves.toEqual({ status: ChatStatus.CLOSED });
    expect(prisma.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: sessionId,
          status: ChatStatus.HUMAN_ACTIVE,
          assignedAnalystId: analystId,
        },
        data: expect.objectContaining({ status: ChatStatus.CLOSED }),
      }),
    );
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sender: MessageSender.SYSTEM,
          content: "Conversa encerrada",
        }),
      }),
    );
  });

  it("retorna 404 para uma conversa inexistente ou encerrada", async () => {
    resolveMock(prisma.chatSession.findUnique, null);
    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    setSession(ChatStatus.CLOSED);
    await expect(
      performAnalystConversationAction(analystId, sessionId, {
        action: "claim",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("sendManualConversationMessage", () => {
  it("permite ao funcionário enviar mensagem durante o handoff da própria conversa", async () => {
    setTransactionSession(ChatStatus.WAITING_HUMAN);
    resolveMock(transactionMock.chatMessage.count, 1);
    resolveMock(transactionMock.chatSession.updateMany, { count: 1 });
    resolveMock(transactionMock.chatMessage.create, {
      id: "message-1",
      chatSessionId: sessionId,
      sender: MessageSender.EMPLOYEE,
      senderUserId: employeeId,
      content: "Ainda estou sem acesso.",
    });

    await expect(
      sendManualConversationMessage(
        employeeId,
        Role.EMPLOYEE,
        sessionId,
        "Ainda estou sem acesso.",
      ),
    ).resolves.toMatchObject({ sender: MessageSender.EMPLOYEE });
    expect(transactionMock.chatSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: employeeId }),
      }),
    );
  });

  it("permite ao analista atribuído responder durante o atendimento humano", async () => {
    setTransactionSession(ChatStatus.HUMAN_ACTIVE, analystId);
    resolveMock(transactionMock.chatMessage.count, 1);
    resolveMock(transactionMock.chatSession.updateMany, { count: 1 });
    resolveMock(transactionMock.chatMessage.create, {
      id: "message-2",
      chatSessionId: sessionId,
      sender: MessageSender.ANALYST,
      senderUserId: analystId,
      content: "Estou verificando.",
    });

    await expect(
      sendManualConversationMessage(
        analystId,
        Role.ANALYST,
        sessionId,
        "Estou verificando.",
      ),
    ).resolves.toMatchObject({
      sender: MessageSender.ANALYST,
      senderUserId: analystId,
    });
  });

  it("nega mensagens de funcionário em conversa de outra pessoa ou fora do handoff", async () => {
    setTransactionSession(ChatStatus.WAITING_HUMAN, null, "employee-2");
    await expect(
      sendManualConversationMessage(
        employeeId,
        Role.EMPLOYEE,
        sessionId,
        "Mensagem indevida.",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    setTransactionSession(ChatStatus.BOT_ACTIVE);
    await expect(
      sendManualConversationMessage(
        employeeId,
        Role.EMPLOYEE,
        sessionId,
        "Mensagem fora do handoff.",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("nega mensagens de analistas não atribuídos", async () => {
    setTransactionSession(ChatStatus.HUMAN_ACTIVE, "analyst-2");
    await expect(
      sendManualConversationMessage(
        analystId,
        Role.ANALYST,
        sessionId,
        "Mensagem indevida.",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("não envia mensagens quando a conversa está ausente ou encerrada", async () => {
    resolveMock(transactionMock.chatSession.findUnique, null);
    await expect(
      sendManualConversationMessage(
        employeeId,
        Role.EMPLOYEE,
        sessionId,
        "Mensagem.",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });

    setTransactionSession(ChatStatus.CLOSED);
    await expect(
      sendManualConversationMessage(
        employeeId,
        Role.EMPLOYEE,
        sessionId,
        "Mensagem.",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("respeita o limite de mensagens da conversa", async () => {
    setTransactionSession(ChatStatus.WAITING_HUMAN);
    resolveMock(transactionMock.chatMessage.count, 30);

    await expect(
      sendManualConversationMessage(
        employeeId,
        Role.EMPLOYEE,
        sessionId,
        "Mensagem excedente.",
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(transactionMock.chatMessage.create).not.toHaveBeenCalled();
  });

  it("detecta alteração concorrente do responsável antes de gravar", async () => {
    setTransactionSession(ChatStatus.HUMAN_ACTIVE, analystId);
    resolveMock(transactionMock.chatMessage.count, 2);
    resolveMock(transactionMock.chatSession.updateMany, { count: 0 });

    await expect(
      sendManualConversationMessage(
        analystId,
        Role.ANALYST,
        sessionId,
        "Mensagem.",
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(transactionMock.chatMessage.create).not.toHaveBeenCalled();
  });
});

describe("createTicketFromDraft", () => {
  const draftOwnerId = "11111111-1111-4111-8111-111111111111";
  const draftMessageId = "draft-message-1";
  const draftMetadata = {
    kind: "ticket_draft",
    draft: {
      title: "VPN corporativa fora",
      description: "Não consigo autenticar na VPN desde a manhã.",
      type: "INCIDENT",
      category: "NETWORK_VPN",
      priority: "HIGH",
      affectedUserIds: [draftOwnerId, "22222222-2222-4222-8222-222222222222"],
    },
  };

  it("confirma rascunho uma vez e força affectedUserIds do autenticado", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
      ticketId: null,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, {
      id: draftMessageId,
      metadata: draftMetadata,
    });
    resolveMock(prisma.$executeRaw, BigInt(1));
    (
      createTicketForUser as unknown as {
        mockResolvedValue: (value: unknown) => unknown;
      }
    ).mockResolvedValue({
      outcome: "created",
      ticket: { id: "ticket-1", code: "INC-1" },
    });
    resolveMock(prisma.chatMessage.create, {
      id: "msg",
      chatSessionId: sessionId,
    });
    resolveMock(prisma.chatSession.update, { id: sessionId });

    await expect(
      createTicketFromDraft(draftOwnerId, draftMessageId),
    ).resolves.toMatchObject({
      outcome: "created",
      ticket: { code: "INC-1" },
    });
    expect(createTicketForUser).toHaveBeenCalledWith(
      draftOwnerId,
      expect.objectContaining({
        confirmed: true,
        affectedUserIds: [draftOwnerId],
      }),
    );
  });

  it("rejeita rascunho já confirmado", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, {
      id: draftMessageId,
      metadata: { ...draftMetadata, confirmed: true },
    });

    await expect(
      createTicketFromDraft(draftOwnerId, draftMessageId),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it("rejeita confirmação concorrente quando o claim SQL não altera linha", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, {
      id: draftMessageId,
      metadata: draftMetadata,
    });
    resolveMock(prisma.$executeRaw, BigInt(0));

    await expect(
      createTicketFromDraft(draftOwnerId, draftMessageId),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(createTicketForUser).not.toHaveBeenCalled();
  });

  it("rejeita confirmação de rascunho cancelado", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, {
      id: draftMessageId,
      metadata: { ...draftMetadata, cancelled: true },
    });

    await expect(
      createTicketFromDraft(draftOwnerId, draftMessageId),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(createTicketForUser).not.toHaveBeenCalled();
  });
});

describe("cancelTicketDraft", () => {
  const draftOwnerId = "11111111-1111-4111-8111-111111111111";
  const draftMessageId = "draft-message-1";
  const draftMetadata = {
    kind: "ticket_draft",
    draft: {
      title: "VPN corporativa fora",
      description: "Não consigo autenticar na VPN desde a manhã.",
      type: "INCIDENT",
      category: "NETWORK_VPN",
      priority: "HIGH",
      affectedUserIds: [draftOwnerId],
    },
  };

  it("cancela rascunho da sessão do autenticado sem criar chamado", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
      ticketId: null,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, {
      id: draftMessageId,
      metadata: draftMetadata,
    });
    resolveMock(prisma.$executeRaw, BigInt(1));
    resolveMock(prisma.chatMessage.create, {
      id: "msg",
      chatSessionId: sessionId,
    });
    resolveMock(prisma.chatSession.update, { id: sessionId });

    await expect(
      cancelTicketDraft(draftOwnerId, draftMessageId),
    ).resolves.toMatchObject({
      messages: expect.any(Array),
    });
    expect(createTicketForUser).not.toHaveBeenCalled();
    expect(prisma.chatMessage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: draftMessageId,
          chatSessionId: sessionId,
          sender: MessageSender.ASSISTANT,
        }),
      }),
    );
  });

  it("rejeita cancelamento de rascunho já confirmado", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, {
      id: draftMessageId,
      metadata: { ...draftMetadata, confirmed: true },
    });

    await expect(
      cancelTicketDraft(draftOwnerId, draftMessageId),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it("não cancela rascunho de outra sessão", async () => {
    resolveMock(prisma.chatSession.findFirst, {
      id: sessionId,
      status: ChatStatus.BOT_ACTIVE,
    });
    resolveMock(prisma.chatMessage.count, 2);
    resolveMock(prisma.chatMessage.findFirst, null);

    await expect(
      cancelTicketDraft(draftOwnerId, draftMessageId),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(createTicketForUser).not.toHaveBeenCalled();
  });
});

it("expõe ConversationError com nome e status HTTP", () => {
  const error = new ConversationError("Conflito", 409);

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("ConversationError");
  expect(error.statusCode).toBe(409);
});
