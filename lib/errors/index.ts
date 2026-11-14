export { AppErrors, type AppErrorKey } from "@/lib/errors/app-errors";
export { ApiRequestError } from "@/lib/errors/api-request-error";
export {
  DomainError,
  fromDomain,
  fromDomainSync,
  toServiceError,
} from "@/lib/errors/domain-error";
export { HttpStatus, type HttpStatusCode } from "@/lib/errors/http-status";
export { jsonError } from "@/lib/errors/json-error";
export {
  err,
  isErr,
  isOk,
  ok,
  unwrapOrThrow,
  type Result,
  type ServiceError,
} from "@/lib/errors/result";
