"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updatePassword } from "@/lib/api/auth";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";

export function useUpdatePasswordForm() {
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(values: UpdatePasswordInput) {
    setIsSubmitting(true);
    setFormMessage("");

    try {
      await updatePassword(values);
      form.reset({ password: "" });
      setFormMessage("Senha atualizada com sucesso.");
    } catch (error) {
      console.error("Falha ao atualizar senha:", error);
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a senha.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    passwordValue: form.watch("password"),
    formMessage,
    isSubmitting,
    isSuccess: formMessage === "Senha atualizada com sucesso.",
  };
}
