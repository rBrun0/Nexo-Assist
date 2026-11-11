import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Digite um e-mail válido.").toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(12).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
