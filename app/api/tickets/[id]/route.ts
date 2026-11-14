import { TicketStatus } from "@prisma/client";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { AppErrors, jsonError } from "@/lib/errors";
import { updateTicketStatusForAnalyst } from "@/lib/services/tickets";
import { analystTicketStatusSchema } from "@/lib/validations/ticket";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(AppErrors.invalidRequestBody);
  }

  try {
    const userResult = await requireUser("ANALYST");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    const { id } = await params;
    const parsed = analystTicketStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(AppErrors.invalidTicketStatus);
    }

    const ticketResult = await updateTicketStatusForAnalyst(
      id,
      parsed.data.status as TicketStatus,
    );
    if (!ticketResult.success) {
      return jsonError(ticketResult.error);
    }
    return NextResponse.json({ ticket: ticketResult.data });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao atualizar status do chamado:", error);
    return jsonError(AppErrors.updateTicketFailed);
  }
}
