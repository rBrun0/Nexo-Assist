import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

const PREVIEW_PREFIX_BY_SENDER: Partial<
  Record<
    NonNullable<AnalystConversationListItem["lastMessageSender"]>,
    (conversation: AnalystConversationListItem, currentAnalystId: string) => string
  >
> = {
  ASSISTANT: (conversation) => `Nexo: ${conversation.preview}`,
  ANALYST: (conversation, currentAnalystId) => {
    const senderLabel =
      conversation.lastMessageSenderUserId === currentAnalystId
        ? "Você"
        : (conversation.lastMessageSenderName ?? "Analista");
    return `${senderLabel}: ${conversation.preview}`;
  },
};

export function formatQueuePreview(
  conversation: AnalystConversationListItem,
  currentAnalystId: string,
) {
  const sender = conversation.lastMessageSender;
  if (!sender) return conversation.preview;
  const build = PREVIEW_PREFIX_BY_SENDER[sender];
  return build ? build(conversation, currentAnalystId) : conversation.preview;
}
