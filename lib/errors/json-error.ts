import { NextResponse } from "next/server";

import type { ServiceError } from "@/lib/errors/result";

export function jsonError(
  error: ServiceError,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: error.message, ...extras },
    { status: error.statusCode },
  );
}
