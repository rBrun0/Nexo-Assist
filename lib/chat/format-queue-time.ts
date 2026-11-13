import { formatMessageTime } from "@/lib/chat/format-message-time";

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Tempo relativo da última mensagem na fila do analista. */
export function formatQueueTime(isoDate: string, now = Date.now()) {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "";

  const elapsedMs = Math.max(0, now - date.getTime());
  if (elapsedMs < 60_000) return "agora";

  const today = startOfLocalDay(new Date(now));
  const messageDay = startOfLocalDay(date);
  const diffDays = Math.round(
    (today.getTime() - messageDay.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return formatMessageTime(isoDate);
  if (diffDays === 1) return "ontem";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}
