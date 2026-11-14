"use server";

import { requireUser } from "@/lib/auth/session";
import { AppErrors } from "@/lib/errors";
import {
  getChatHistoryForUser,
  sendManualConversationMessage,
} from "@/lib/services/conversations";
import {
  chatSessionIdSchema,
  manualChatMessageSchema,
} from "@/lib/validations/chat";

export async function getChatHistoryAction(sessionId: unknown) {
  const parsedSessionId = chatSessionIdSchema.safeParse(sessionId);
  if (!parsedSessionId.success) {
    return {
      success: false as const,
      error: AppErrors.invalidChatSessionId.message,
    };
  }

  try {
    const userResult = await requireUser();
    if (!userResult.success) {
      return { success: false as const, error: userResult.error.message };
    }
    const user = userResult.data;

    const messagesResult = await getChatHistoryForUser(
      user.id,
      user.role,
      parsedSessionId.data,
    );
    if (!messagesResult.success) {
      return { success: false as const, error: messagesResult.error.message };
    }

    return { success: true as const, messages: messagesResult.data };
  } catch (error) {
    console.error("Falha ao carregar histórico pela Server Action:", error);
    return {
      success: false as const,
      error: AppErrors.loadHistoryFailed.message,
    };
  }
}

export async function sendManualChatMessageAction(input: unknown) {
  const parsed = manualChatMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: AppErrors.invalidManualChatMessage.message,
    };
  }

  try {
    const userResult = await requireUser();
    if (!userResult.success) {
      return { success: false as const, error: userResult.error.message };
    }
    const user = userResult.data;

    const messageResult = await sendManualConversationMessage(
      user.id,
      user.role,
      parsed.data.sessionId,
      parsed.data.message,
    );
    if (!messageResult.success) {
      return { success: false as const, error: messageResult.error.message };
    }
    const message = messageResult.data;

    return {
      success: true as const,
      message: {
        id: message.id,
        chatSessionId: message.chatSessionId,
        sender: message.sender,
        senderUserId: message.senderUserId,
        senderUser: {
          id: user.id,
          name: user.name,
          role: user.role,
          job: user.job,
        },
        content: message.content,
        thoughtProcess: message.thoughtProcess,
        metadata: message.metadata,
        readAtByEmployee: message.readAtByEmployee?.toISOString() ?? null,
        readAtByAnalyst: message.readAtByAnalyst?.toISOString() ?? null,
        createdAt: message.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Falha ao enviar mensagem pela Server Action:", error);
    return {
      success: false as const,
      error: AppErrors.sendMessageFailed.message,
    };
  }
}
