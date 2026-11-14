export type ServiceError = {
  message: string;
  statusCode: number;
};

export type Result<T, E = ServiceError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { success: false; error: E } {
  return !result.success;
}

/** Re-throws domain failures so nested public calls keep a single Result boundary. */
export function unwrapOrThrow<T>(
  result: Result<T>,
  toError: (error: ServiceError) => Error,
): T {
  if (!result.success) {
    throw toError(result.error);
  }
  return result.data;
}
