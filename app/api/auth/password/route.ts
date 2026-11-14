import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { updateUserPassword } from "@/lib/auth/update-password";
import { AppErrors, jsonError } from "@/lib/errors";
import { updatePasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(AppErrors.invalidBody);
  }

  const parsed = updatePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(AppErrors.invalidPasswordInput);
  }

  try {
    const userResult = await requireUser();
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    await updateUserPassword(userResult.data.id, parsed.data.password);
    return NextResponse.json({ success: true });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao atualizar senha local:", error);
    return jsonError(AppErrors.passwordUpdateFailed);
  }
}
