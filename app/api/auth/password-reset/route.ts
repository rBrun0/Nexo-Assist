import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "A redefinição por e-mail não está disponível na autenticação local. Solicite a redefinição ao suporte.",
    },
    { status: 410 }
  );
}
