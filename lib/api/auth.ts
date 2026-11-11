import { ApiRequestError, postJson } from "@/lib/api/http";
import type { LoginInput, UpdatePasswordInput } from "@/lib/validations/auth";

export type AuthUserSummary = {
  name: string;
  email: string;
  role: "EMPLOYEE" | "ANALYST";
};

type LoginResponse = {
  user: AuthUserSummary;
};

export async function login(input: LoginInput) {
  const result = await postJson<LoginResponse>("/api/auth/login", input, {
    fallbackError: "Não foi possível iniciar a sessão.",
  });

  if (!result?.user?.role) {
    throw new ApiRequestError("Não foi possível iniciar a sessão.", 500);
  }

  return result.user;
}

export async function logout() {
  await postJson<{ success: true }>("/api/auth/logout", undefined, {
    fallbackError: "A sessão não pôde ser encerrada.",
  });
}

export async function updatePassword(input: UpdatePasswordInput) {
  await postJson<{ success: true }>("/api/auth/password", input, {
    fallbackError: "Não foi possível atualizar a senha.",
  });
}
