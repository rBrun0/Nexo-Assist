import { err, ok, type Result, type ServiceError } from "@/lib/errors/result";

export class DomainError extends Error {
  readonly statusCode: number;

  constructor(error: ServiceError) {
    super(error.message);
    this.name = "DomainError";
    this.statusCode = error.statusCode;
  }

  toServiceError(): ServiceError {
    return { message: this.message, statusCode: this.statusCode };
  }
}

export function toServiceError(error: DomainError): ServiceError {
  return error.toServiceError();
}

/**
 * Runs a domain operation that may throw DomainError (including inside
 * Prisma transactions for rollback). Expected domain failures become Result.err;
 * any other error rethrows.
 */
export async function fromDomain<T>(
  operation: () => Promise<T>,
): Promise<Result<T>> {
  try {
    return ok(await operation());
  } catch (error) {
    if (error instanceof DomainError) {
      return err(error.toServiceError());
    }
    throw error;
  }
}

export function fromDomainSync<T>(operation: () => T): Result<T> {
  try {
    return ok(operation());
  } catch (error) {
    if (error instanceof DomainError) {
      return err(error.toServiceError());
    }
    throw error;
  }
}
