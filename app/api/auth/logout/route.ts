import { NextResponse } from "next/server";

import { clearLocalSession } from "@/lib/auth/local-session";

export async function POST() {
  try {
    await clearLocalSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Falha ao encerrar sessão local:", error);
    return NextResponse.json(
      { error: "Não foi possível encerrar a sessão." },
      { status: 500 }
    );
  }
}
