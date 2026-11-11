import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import {
  ConversationError,
  getAnalystConversation,
  markConversationReadByAnalyst,
  performAnalystConversationAction,
} from "@/lib/services/conversations";
import { analystConversationActionSchema } from "@/lib/validations/conversation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser("ANALYST");
    const { id } = await params;
    const conversation = await getAnalystConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    await markConversationReadByAnalyst(id, user.id);
    return NextResponse.json({
      conversation: await getAnalystConversation(id),
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Falha ao carregar conversa do analista:", error);
    return NextResponse.json({ error: "Não foi possível carregar a conversa." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const user = await requireUser("ANALYST");
    const parsed = analystConversationActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    const { id } = await params;
    const result = await performAnalystConversationAction(user.id, id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof ConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Falha ao executar ação do analista:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a conversa." }, { status: 500 });
  }
}
