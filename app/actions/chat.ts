"use server";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import {
  ConversationError,
  getChatHistoryForUser,
  sendManualConversationMessage,
} from "@/lib/services/conversations";
import { chatSessionIdSchema, manualChatMessageSchema } from "@/lib/validations/chat";

export async function getChatHistoryAction(sessionId: unknown) {
  const parsedSessionId = chatSessionIdSchema.safeParse(sessionId);
  if (!parsedSessionId.success) {
    return { success: false as const, error: "Identificador de conversa inválido." };
  }

  try {
    const user = await requireUser();
    const messages = await getChatHistoryForUser(
      user.id,
      user.role,
      parsedSessionId.data
    );
    return { success: true as const, messages };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return { success: false as const, error: error.message };
    }
    if (error instanceof ConversationError) {
      return { success: false as const, error: error.message };
    }

    console.error("Falha ao carregar histórico pela Server Action:", error);
    return {
      success: false as const,
      error: "Não foi possível carregar o histórico da conversa.",
    };
  }
}

export async function sendManualChatMessageAction(input: unknown) {
  const parsed = manualChatMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Informe uma conversa válida e uma mensagem de até 4000 caracteres.",
    };
  }

  try {
    const user = await requireUser();
    const message = await sendManualConversationMessage(
      user.id,
      user.role,
      parsed.data.sessionId,
      parsed.data.message
    );
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
    if (error instanceof AuthSessionError) {
      return { success: false as const, error: error.message };
    }
    if (error instanceof ConversationError) {
      return { success: false as const, error: error.message };
    }

    console.error("Falha ao enviar mensagem pela Server Action:", error);
    return {
      success: false as const,
      error: "Não foi possível enviar a mensagem.",
    };
  }
}
