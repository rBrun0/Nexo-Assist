import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { AppErrors, jsonError } from "@/lib/errors";
import { listAnalystConversations } from "@/lib/services/conversations";

export async function GET() {
  try {
    const userResult = await requireUser("ANALYST");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    const user = userResult.data;
    return NextResponse.json({
      conversations: await listAnalystConversations(),
      currentAnalyst: { id: user.id, name: user.name },
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao carregar fila do analista:", error);
    return jsonError(AppErrors.loadQueueFailed);
  }
}
