import { ApiRequestError, getJson, postJson } from "@/lib/api/http";
import type { AnalystConversationView } from "@/lib/types/conversation";

export type AnalystConversationLifecycleAction =
  | "claim"
  | "return_to_bot"
  | "close";

export async function listAnalystConversations() {
  const result = await getJson<{ conversations: AnalystConversationView[] }>(
    "/api/analyst/conversations",
    { fallbackError: "Não foi possível atualizar a fila." },
  );

  if (!result?.conversations) {
    throw new ApiRequestError("Não foi possível atualizar a fila.", 500);
  }

  return result.conversations;
}

export async function getAnalystConversation(conversationId: string) {
  const result = await getJson<{ conversation: AnalystConversationView }>(
    `/api/analyst/conversations/${conversationId}`,
    { fallbackError: "Não foi possível abrir a conversa." },
  );

  if (!result?.conversation) {
    throw new ApiRequestError("Não foi possível abrir a conversa.", 500);
  }

  return result.conversation;
}

export async function postAnalystConversationAction(
  conversationId: string,
  action: AnalystConversationLifecycleAction,
) {
  await postJson(
    `/api/analyst/conversations/${conversationId}`,
    { action },
    { fallbackError: "Não foi possível atualizar a conversa." },
  );
}
