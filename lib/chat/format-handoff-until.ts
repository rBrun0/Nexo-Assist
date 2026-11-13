/** Janela de primeiro contato humano após o transbordo. */
export const HANDOFF_FIRST_CONTACT_MS = 2 * 60 * 60 * 1000;

function formatRemaining(ms: number) {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "prazo vencido";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatHandoffUntil(
  handoffAt: string | null,
  now = Date.now(),
) {
  if (!handoffAt) return null;
  const timestamp = new Date(handoffAt).getTime();
  if (!Number.isFinite(timestamp)) return null;

  const remaining = timestamp + HANDOFF_FIRST_CONTACT_MS - now;
  if (remaining < 60_000) return "prazo vencido";
  return formatRemaining(remaining);
}
