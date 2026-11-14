import { HttpStatus } from "@/lib/errors/http-status";

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}
