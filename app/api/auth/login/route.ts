import { NextResponse } from "next/server";

import { authenticateLocalUser } from "@/lib/auth/local-auth";
import { setLocalSession } from "@/lib/auth/local-session";
import { AppErrors, jsonError } from "@/lib/errors";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(AppErrors.invalidRequestBody);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(AppErrors.invalidLoginInput);
  }

  try {
    const user = await authenticateLocalUser(
      parsed.data.email,
      parsed.data.password,
    );
    if (!user) {
      return jsonError(AppErrors.invalidCredentials);
    }

    await setLocalSession(user, { rememberMe: parsed.data.rememberMe });

    return NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Falha ao autenticar usuário:", error);
    return jsonError(AppErrors.loginConfigFailed);
  }
}
