type ErrorLike = {
  name?: unknown;
  message?: unknown;
  statusCode?: unknown;
  url?: unknown;
  isRetryable?: unknown;
  data?: unknown;
  cause?: unknown;
  responseBody?: unknown;
};

export type AgentErrorContext = {
  model?: string;
  finishReason?: string;
  phase?: "primary" | "retry" | "stream";
  thinkingConfig?: unknown;
};

function asErrorLike(value: unknown): ErrorLike | null {
  if (typeof value !== "object" || value === null) return null;
  return value as ErrorLike;
}

function readGoogleApiMessage(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const error = (data as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

function walkErrorChain(
  value: unknown,
  visit: (error: ErrorLike) => void,
  depth = 0
) {
  if (depth > 5) return;
  const error = asErrorLike(value);
  if (!error) return;
  visit(error);
  walkErrorChain(error.cause, visit, depth + 1);
}

function isNoOutputMessage(message: string) {
  return (
    message === "No output generated." ||
    message.startsWith("No output generated")
  );
}

function isQuotaOrRateLimitText(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("quota") ||
    normalized.includes("rate-limit") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("too many requests") ||
    normalized.includes("free tier")
  );
}

function isQuotaOrRateLimitError({
  statusCode,
  googleMessage,
  fallbackMessage,
  responseBody,
}: {
  statusCode?: number;
  googleMessage: string | null;
  fallbackMessage: string | null;
  responseBody: string | null;
}) {
  if (statusCode === 429) return true;
  const candidates = [googleMessage, fallbackMessage, responseBody].filter(
    (value): value is string => Boolean(value),
  );
  return candidates.some(isQuotaOrRateLimitText);
}

/**
 * Extrai uma mensagem útil de erros do AI SDK / Google Gemini para log e UI.
 * Em desenvolvimento inclui status/URL quando disponíveis.
 */
export function formatAgentError(
  error: unknown,
  context: AgentErrorContext = {}
): string {
  let googleMessage: string | null = null;
  let fallbackMessage: string | null = null;
  let responseBody: string | null = null;
  let statusCode: number | undefined;
  let name: string | undefined;
  let url: string | undefined;
  let sawNoOutput = false;

  walkErrorChain(error, (node) => {
    if (!googleMessage) {
      googleMessage = readGoogleApiMessage(node.data);
    }
    if (
      !responseBody &&
      typeof node.responseBody === "string" &&
      node.responseBody.trim()
    ) {
      responseBody = node.responseBody.trim();
    }
    if (typeof node.message === "string" && node.message.trim()) {
      if (isNoOutputMessage(node.message)) {
        sawNoOutput = true;
      } else if (!fallbackMessage) {
        fallbackMessage = node.message.trim();
      }
    }
    if (typeof node.name === "string" && node.name.includes("NoOutput")) {
      sawNoOutput = true;
    }
    if (statusCode === undefined && typeof node.statusCode === "number") {
      statusCode = node.statusCode;
    }
    if (!name && typeof node.name === "string" && node.name) {
      name = node.name;
    }
    if (!url && typeof node.url === "string" && node.url) {
      url = node.url;
    }
  });

  if (!fallbackMessage) {
    const root = asErrorLike(error);
    if (typeof root?.message === "string" && root.message.trim()) {
      if (isNoOutputMessage(root.message)) {
        sawNoOutput = true;
      } else {
        fallbackMessage = root.message.trim();
      }
    }
  }

  if (
    isQuotaOrRateLimitError({
      statusCode,
      googleMessage,
      fallbackMessage,
      responseBody,
    })
  ) {
    const modelHint = context.model ? ` (modelo ${context.model})` : "";
    const details: string[] = [];
    if (typeof statusCode === "number") {
      details.push(`HTTP ${statusCode}`);
    }
    if (name) {
      details.push(name);
    }
    const base =
      `Cota diária do Gemini esgotada${modelHint}. Aguarde o reset da cota, ajuste o plano/billing ou troque GEMINI_MODEL.`;
    if (details.length === 0) return base;
    return `${base} (${details.join(" · ")})`;
  }

  let message =
    googleMessage ??
    fallbackMessage ??
    (sawNoOutput
      ? "O modelo não gerou texto na resposta."
      : "Não foi possível gerar uma resposta agora. Tente novamente.");

  if (sawNoOutput && !googleMessage) {
    const hints = [
      context.model ? `modelo=${context.model}` : null,
      context.finishReason ? `finishReason=${context.finishReason}` : null,
      context.phase ? `fase=${context.phase}` : null,
      "verifique GEMINI_MODEL e thinkingConfig (Gemini 3.x usa thinkingLevel, não thinkingBudget:0)",
    ].filter(Boolean);
    message = `${message} ${hints.join(" · ")}`;
  }

  const details: string[] = [];
  if (typeof statusCode === "number") {
    details.push(`HTTP ${statusCode}`);
  }
  if (name) {
    details.push(name);
  }
  if (process.env.NODE_ENV !== "production" && url) {
    details.push(url);
  }

  if (details.length === 0) return message;
  return `${message} (${details.join(" · ")})`;
}

export function logAgentError(
  contextLabel: string,
  error: unknown,
  context: AgentErrorContext = {}
) {
  const chain: Array<Record<string, unknown>> = [];
  walkErrorChain(error, (node) => {
    chain.push({
      name: node.name,
      message: node.message,
      statusCode: node.statusCode,
      url: node.url,
      isRetryable: node.isRetryable,
      data: node.data,
      responseBody: node.responseBody,
    });
  });

  console.error(contextLabel, {
    formatted: formatAgentError(error, context),
    context,
    chain,
    raw: error,
  });
}
