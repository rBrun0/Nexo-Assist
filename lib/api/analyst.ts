import { AppErrors, err, ok, type Result } from "@/lib/errors";
import { getJson, postJson } from "@/lib/api/http";
import type { AnalystConversationView } from "@/lib/types/conversation";

export type AnalystConversationLifecycleAction =
  | "claim"
  | "return_to_bot"
  | "close";

export async function listAnalystConversations(): Promise<
  Result<AnalystConversationView[]>
> {
  const result = await getJson<{ conversations: AnalystConversationView[] }>(
    "/api/analyst/conversations",
    { fallbackError: AppErrors.refreshQueueFailed },
  );

  if (!result.success) {
    return result;
  }

  if (!result.data?.conversations) {
    return err(AppErrors.refreshQueueFailed);
  }

  return ok(result.data.conversations);
}

export async function getAnalystConversation(
  conversationId: string,
): Promise<Result<AnalystConversationView>> {
  const result = await getJson<{ conversation: AnalystConversationView }>(
    `/api/analyst/conversations/${conversationId}`,
    { fallbackError: AppErrors.openConversationFailed },
  );

  if (!result.success) {
    return result;
  }

  if (!result.data?.conversation) {
    return err(AppErrors.openConversationFailed);
  }

  return ok(result.data.conversation);
}

export async function postAnalystConversationAction(
  conversationId: string,
  action: AnalystConversationLifecycleAction,
): Promise<Result<unknown>> {
  return postJson(
    `/api/analyst/conversations/${conversationId}`,
    { action },
    { fallbackError: AppErrors.updateConversationFailed },
  );
}
