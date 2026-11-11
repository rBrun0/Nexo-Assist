import { TicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import {
  TicketInputError,
  updateTicketStatusForAnalyst,
} from "@/lib/services/tickets";
import { analystTicketStatusSchema } from "@/lib/validations/ticket";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  try {
    await requireUser("ANALYST");
    const { id } = await params;
    const parsed = analystTicketStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Status de chamado inválido." },
        { status: 400 },
      );
    }

    const ticket = await updateTicketStatusForAnalyst(
      id,
      parsed.data.status as TicketStatus,
    );
    return NextResponse.json({ ticket });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    if (error instanceof TicketInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Falha ao atualizar status do chamado:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o chamado." },
      { status: 500 },
    );
  }
}
