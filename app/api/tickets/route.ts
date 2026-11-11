import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import {
  createTicketForUser,
  listTicketsForUser,
  TicketInputError,
} from "@/lib/services/tickets";
import { createTicketSchema } from "@/lib/validations/ticket";

export async function GET() {
  try {
    const user = await requireUser("EMPLOYEE");
    const tickets = await listTicketsForUser(user.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Falha ao consultar chamados do funcionário:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar os chamados." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const user = await requireUser("EMPLOYEE");
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados do chamado inválidos.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await createTicketForUser(user.id, parsed.data);
    return NextResponse.json(result, {
      status: result.outcome === "created" ? 201 : 200,
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof TicketInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Falha ao salvar chamado:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o chamado. Tente novamente." },
      { status: 500 }
    );
  }
}
