import { NextResponse } from "next/server";

import { clearLocalSession } from "@/lib/auth/local-session";
import { AppErrors, jsonError } from "@/lib/errors";

export async function POST() {
  try {
    await clearLocalSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Falha ao encerrar sessão local:", error);
    return jsonError(AppErrors.logoutFailed);
  }
}
