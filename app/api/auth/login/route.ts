import { NextResponse } from "next/server";

import { authenticateLocalUser } from "@/lib/auth/local-auth";
import { setLocalSession } from "@/lib/auth/local-session";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Informe um e-mail válido e uma senha." },
      { status: 400 }
    );
  }

  try {
    const user = await authenticateLocalUser(
      parsed.data.email,
      parsed.data.password
    );
    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    await setLocalSession(user);

    return NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Falha ao autenticar usuário:", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar a sessão. Verifique a configuração do servidor." },
      { status: 500 }
    );
  }
}
