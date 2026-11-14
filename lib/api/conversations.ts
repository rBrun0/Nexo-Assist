import { AppErrors, err, ok, type Result } from "@/lib/errors";
import { getJson, postJson } from "@/lib/api/http";
import type { EmployeeConversation } from "@/lib/types/employee-conversation";

type ConversationResponse = {
  conversation: EmployeeConversation | null;
};

type ConversationMutationResponse = {
  conversation: EmployeeConversation;
};

async function postMyConversationAction(
  body: Record<string, unknown>,
  fallbackError: (typeof AppErrors)[keyof typeof AppErrors],
): Promise<Result<EmployeeConversation>> {
  const result = await postJson<ConversationMutationResponse>(
    "/api/conversations/me",
    body,
    { fallbackError },
  );

  if (!result.success) {
    return result;
  }

  if (!result.data?.conversation) {
    return err(fallbackError);
  }

  return ok(result.data.conversation);
}

export async function getMyConversation(): Promise<
  Result<EmployeeConversation | null>
> {
  const result = await getJson<ConversationResponse>("/api/conversations/me", {
    fallbackError: AppErrors.loadConversationFailed,
  });

  if (!result.success) {
    return result;
  }

  return ok(result.data.conversation ?? null);
}

export async function confirmTicketDraft(draftMessageId: string) {
  return postMyConversationAction(
    { action: "confirm_ticket", draftMessageId },
    AppErrors.confirmTicketFailed,
  );
}

export async function cancelTicketDraft(draftMessageId: string) {
  return postMyConversationAction(
    { action: "cancel_ticket", draftMessageId },
    AppErrors.cancelDraftFailed,
  );
}

export async function requestAnalyst(reason: string) {
  return postMyConversationAction(
    { action: "request_analyst", reason },
    AppErrors.requestAnalystFailed,
  );
}

export async function endConversation(): Promise<
  Result<EmployeeConversation | null>
> {
  const result = await postJson<ConversationResponse>(
    "/api/conversations/me",
    { action: "end_conversation" },
    { fallbackError: AppErrors.endConversationFailed },
  );

  if (!result.success) {
    return result;
  }

  return ok(result.data.conversation ?? null);
}
