"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { login } from "@/lib/api/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function useLoginForm() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setFormMessage("");
    setIsSubmitting(true);

    try {
      const user = await login(values);
      router.replace(
        user.role === "ANALYST" ? "/analyst" : "/employee/atendimento",
      );
      router.refresh();
    } catch (error) {
      console.error("Falha na requisição de login:", error);
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a sessão.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    formMessage,
    isSubmitting,
  };
}
