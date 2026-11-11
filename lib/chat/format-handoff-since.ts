import { formatMessageTime } from "@/lib/chat/format-message-time";

export function formatHandoffSince(handoffAt: string | null) {
  if (!handoffAt) return null;
  const date = new Date(handoffAt);
  if (!Number.isFinite(date.getTime())) return null;
  return formatMessageTime(handoffAt);
}
