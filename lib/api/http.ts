import { AppErrors } from "@/lib/errors/app-errors";
import { ApiRequestError } from "@/lib/errors/api-request-error";
import { HttpStatus } from "@/lib/errors/http-status";
import { err, ok, type Result, type ServiceError } from "@/lib/errors/result";
import { isRecord } from "@/lib/utils/is-record";

export { ApiRequestError };

type JsonBody =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

type RequestOptions = {
  fallbackError?: ServiceError;
  cache?: RequestCache;
};

function toServiceError(error: ApiRequestError): ServiceError {
  return {
    message: error.message,
    statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  };
}

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
      AppErrors.invalidServerResponse.message,
      response.status || AppErrors.invalidServerResponse.statusCode,
    );
  }
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  options?: RequestOptions,
): Promise<Result<T>> {
  const fallbackError = options?.fallbackError ?? AppErrors.unexpected;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: options?.cache ?? init.cache,
    });
  } catch {
    return err(AppErrors.networkUnavailable);
  }

  let payload: unknown;
  try {
    payload = await parseJson(response);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return err(toServiceError(error));
    }
    throw error;
  }

  if (!response.ok) {
    return err({
      message: readErrorMessage(payload, fallbackError.message),
      statusCode: response.status,
    });
  }

  return ok(payload as T);
}

export async function getJson<T>(
  url: string,
  options?: RequestOptions,
): Promise<Result<T>> {
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
): Promise<Result<T>> {
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
): Promise<Result<T>> {
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
