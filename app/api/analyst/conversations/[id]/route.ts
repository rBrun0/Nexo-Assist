import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { AppErrors, jsonError } from "@/lib/errors";
import {
  getAnalystConversation,
  markConversationReadByAnalyst,
  performAnalystConversationAction,
} from "@/lib/services/conversations";
import { analystConversationActionSchema } from "@/lib/validations/conversation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const userResult = await requireUser("ANALYST");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    const user = userResult.data;
    const { id } = await params;
    const conversation = await getAnalystConversation(id);
    if (!conversation) {
      return jsonError(AppErrors.conversationNotFound);
    }

    await markConversationReadByAnalyst(id, user.id);
    return NextResponse.json({
      conversation: await getAnalystConversation(id),
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao carregar conversa do analista:", error);
    return jsonError(AppErrors.loadConversationFailed);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
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
    const parsed = analystConversationActionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(AppErrors.invalidAction);
    }

    const { id } = await params;
    const result = await performAnalystConversationAction(
      userResult.data.id,
      id,
      parsed.data,
    );
    if (!result.success) {
      return jsonError(result.error);
    }
    return NextResponse.json(result.data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao executar ação do analista:", error);
    return jsonError(AppErrors.updateConversationFailed);
  }
}
