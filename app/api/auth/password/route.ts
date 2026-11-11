import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import { updateUserPassword } from "@/lib/auth/update-password";
import { updatePasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = updatePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A senha deve ter entre 12 e 128 caracteres." },
      { status: 400 }
    );
  }

  try {
    const currentUser = await requireUser();
    await updateUserPassword(currentUser.id, parsed.data.password);
    return NextResponse.json({ success: true });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Falha ao atualizar senha local:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a senha." },
      { status: 500 }
    );
  }
}
