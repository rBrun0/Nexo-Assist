import { isRecord } from "@/lib/utils/is-record";

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

type JsonBody =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

type RequestOptions = {
  fallbackError?: string;
  cache?: RequestCache;
};

function readErrorMessage(payload: unknown, fallback: string) {
  if (
    isRecord(payload) &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }
  return fallback;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError(
      "Resposta inválida do servidor.",
      response.status,
    );
  }
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  const fallbackError =
    options?.fallbackError ?? "Não foi possível completar a requisição.";

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: options?.cache ?? init.cache,
    });
  } catch {
    throw new ApiRequestError(
      "Não foi possível conectar ao servidor. Tente novamente.",
      0,
    );
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new ApiRequestError(
      readErrorMessage(payload, fallbackError),
      response.status,
    );
  }

  return payload as T;
}

export async function getJson<T>(
  url: string,
  options?: RequestOptions,
): Promise<T> {
  return requestJson<T>(
    url,
    { method: "GET" },
    { cache: "no-store", ...options },
  );
}

export async function postJson<T>(
  url: string,
  body?: JsonBody,
  options?: RequestOptions,
): Promise<T> {
  return requestJson<T>(
    url,
    {
      method: "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options,
  );
}

export async function patchJson<T>(
  url: string,
  body?: JsonBody,
  options?: RequestOptions,
): Promise<T> {
  return requestJson<T>(
    url,
    {
      method: "PATCH",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options,
  );
}
