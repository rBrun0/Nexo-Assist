export const HONEST_EMPTY_AGENT_REPLY =
  "Não consegui gerar uma resposta agora. Tente de novo.";

export function shouldRetryWithoutTools(
  primaryText: string,
  actionCount: number
) {
  return primaryText.trim().length === 0 && actionCount === 0;
}

export function pickAssistantResponseText({
  primaryText,
  retryText,
}: {
  primaryText: string;
  retryText?: string;
}) {
  const primary = primaryText.trim();
  if (primary) {
    return { text: primary, source: "primary" as const };
  }

  const retry = retryText?.trim() ?? "";
  if (retry) {
    return { text: retry, source: "retry" as const };
  }

  return { text: HONEST_EMPTY_AGENT_REPLY, source: "fallback" as const };
}
