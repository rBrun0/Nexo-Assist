import { ApiRequestError, getJson, postJson } from "@/lib/api/http";
import type { EmployeeConversation } from "@/lib/types/employee-conversation";

type ConversationResponse = {
  conversation: EmployeeConversation | null;
};

type ConversationMutationResponse = {
  conversation: EmployeeConversation;
};

async function postMyConversationAction(
  body: Record<string, unknown>,
  fallbackError: string,
) {
  const result = await postJson<ConversationMutationResponse>(
    "/api/conversations/me",
    body,
    { fallbackError },
  );

  if (!result?.conversation) {
    throw new ApiRequestError(fallbackError, 500);
  }

  return result.conversation;
}

export async function getMyConversation() {
  const result = await getJson<ConversationResponse>("/api/conversations/me", {
    fallbackError: "Não foi possível carregar a conversa.",
  });
  return result.conversation ?? null;
}

export async function confirmTicketDraft(draftMessageId: string) {
  return postMyConversationAction(
    { action: "confirm_ticket", draftMessageId },
    "Não foi possível confirmar o chamado.",
  );
}

export async function cancelTicketDraft(draftMessageId: string) {
  return postMyConversationAction(
    { action: "cancel_ticket", draftMessageId },
    "Não foi possível cancelar o rascunho.",
  );
}

export async function requestAnalyst(reason: string) {
  return postMyConversationAction(
    { action: "request_analyst", reason },
    "Não foi possível solicitar um analista.",
  );
}

export async function endConversation() {
  const result = await postJson<ConversationResponse>(
    "/api/conversations/me",
    { action: "end_conversation" },
    { fallbackError: "Não foi possível encerrar a conversa." },
  );
  return result.conversation ?? null;
}
