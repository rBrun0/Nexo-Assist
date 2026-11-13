export type ChatEventDividerKind =
  | "transfer"
  | "claim"
  | "return_to_bot"
  | "closed"
  | null;

export function getChatEventDividerKind(label: string): ChatEventDividerKind {
  const normalized = label.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return null;

  if (
    normalized.includes("transferida") ||
    normalized.includes("transferido")
  ) {
    return "transfer";
  }

  if (normalized.includes("assumiu")) {
    return "claim";
  }

  if (normalized.includes("devolvida") || normalized.includes("retomou")) {
    return "return_to_bot";
  }

  if (normalized.includes("encerrada") || normalized.includes("encerrado")) {
    return "closed";
  }

  return null;
}
