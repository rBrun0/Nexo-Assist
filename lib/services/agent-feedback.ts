import { MessageSender, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class AgentFeedbackError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AgentFeedbackError";
  }
}

export async function submitAgentFeedback({
  userId,
  role,
  messageId,
  note,
}: {
  userId: string;
  role: Role;
  messageId: string;
  note?: string;
}) {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      sender: true,
      thoughtProcess: true,
      chatSessionId: true,
      chatSession: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!message || message.sender !== MessageSender.ASSISTANT) {
    throw new AgentFeedbackError(
      "Mensagem do agente não encontrada.",
      404,
    );
  }

  if (message.thoughtProcess == null) {
    throw new AgentFeedbackError(
      "Esta mensagem não possui raciocínio do agente para contestar.",
      400,
    );
  }

  const isEmployeeOwner =
    role === Role.EMPLOYEE && message.chatSession.userId === userId;
  const isAnalyst = role === Role.ANALYST;

  if (!isEmployeeOwner && !isAnalyst) {
    throw new AgentFeedbackError(
      "Sem permissão para registrar feedback nesta conversa.",
      403,
    );
  }

  try {
    return await prisma.agentFeedback.create({
      data: {
        messageId: message.id,
        userId,
        chatSessionId: message.chatSessionId,
        note: note?.trim() ? note.trim() : null,
      },
      select: { id: true, createdAt: true },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new AgentFeedbackError(
        "Você já registrou feedback para esta mensagem.",
        409,
      );
    }
    throw error;
  }
}
