import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import { listAnalystConversations } from "@/lib/services/conversations";

export async function GET() {
  try {
    const user = await requireUser("ANALYST");
    return NextResponse.json({
      conversations: await listAnalystConversations(),
      currentAnalyst: { id: user.id, name: user.name },
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Falha ao carregar fila do analista:", error);
    return NextResponse.json({ error: "Não foi possível carregar a fila." }, { status: 500 });
  }
}
