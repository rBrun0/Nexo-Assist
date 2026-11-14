import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { AppErrors, HttpStatus, jsonError } from "@/lib/errors";
import {
  createTicketForUser,
  listTicketsForUser,
} from "@/lib/services/tickets";
import { createTicketSchema } from "@/lib/validations/ticket";

export async function GET() {
  try {
    const userResult = await requireUser("EMPLOYEE");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    const tickets = await listTicketsForUser(userResult.data.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao consultar chamados do funcionário:", error);
    return jsonError(AppErrors.listTicketsFailed);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(AppErrors.invalidRequestBody);
  }

  try {
    const userResult = await requireUser("EMPLOYEE");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(AppErrors.invalidTicketData, {
        issues: parsed.error.issues,
      });
    }

    const result = await createTicketForUser(userResult.data.id, parsed.data);
    return NextResponse.json(result, {
      status:
        result.outcome === "created" ? HttpStatus.CREATED : HttpStatus.OK,
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao salvar chamado:", error);
    return jsonError(AppErrors.saveTicketFailed);
  }
}
