import { AppErrors, err, ok, type Result } from "@/lib/errors";
import { postJson } from "@/lib/api/http";
import type { LoginInput, UpdatePasswordInput } from "@/lib/validations/auth";

export type AuthUserSummary = {
  name: string;
  email: string;
  role: "EMPLOYEE" | "ANALYST";
};

type LoginResponse = {
  user: AuthUserSummary;
};

export async function login(
  input: LoginInput,
): Promise<Result<AuthUserSummary>> {
  const result = await postJson<LoginResponse>("/api/auth/login", input, {
    fallbackError: AppErrors.loginFailed,
  });

  if (!result.success) {
    return result;
  }

  if (!result.data?.user?.role) {
    return err(AppErrors.loginFailed);
  }

  return ok(result.data.user);
}

export async function logout(): Promise<Result<{ success: true }>> {
  return postJson<{ success: true }>("/api/auth/logout", undefined, {
    fallbackError: AppErrors.logoutFailedClient,
  });
}

export async function updatePassword(
  input: UpdatePasswordInput,
): Promise<Result<{ success: true }>> {
  return postJson<{ success: true }>("/api/auth/password", input, {
    fallbackError: AppErrors.passwordUpdateFailed,
  });
}
