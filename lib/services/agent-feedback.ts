import { MessageSender, Role } from "@prisma/client";

import { AppErrors, DomainError, fromDomain, type Result } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

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
}): Promise<Result<{ id: string; createdAt: Date }>> {
  return fromDomain(async () => {
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
      throw new DomainError(AppErrors.agentMessageNotFound);
    }

    if (message.thoughtProcess == null) {
      throw new DomainError(AppErrors.agentMessageWithoutThought);
    }

    const isEmployeeOwner =
      role === Role.EMPLOYEE && message.chatSession.userId === userId;
    const isAnalyst = role === Role.ANALYST;

    if (!isEmployeeOwner && !isAnalyst) {
      throw new DomainError(AppErrors.agentFeedbackForbidden);
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
        throw new DomainError(AppErrors.agentFeedbackAlreadyExists);
      }
      throw error;
    }
  });
}
