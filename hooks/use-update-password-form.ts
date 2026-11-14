"use client";

import { useState } from "react";

import { updatePassword } from "@/lib/api/auth";
import { useUpdatePasswordFields } from "@/lib/forms/use-update-password-fields";
import type { UpdatePasswordInput } from "@/lib/validations/auth";

export function useUpdatePasswordForm() {
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useUpdatePasswordFields();

  async function onSubmit(values: UpdatePasswordInput) {
    setIsSubmitting(true);
    setFormMessage("");

    const result = await updatePassword(values);
    if (!result.success) {
      console.error("Falha ao atualizar senha:", result.error);
      setFormMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    form.reset({ password: "" });
    setFormMessage("Senha atualizada com sucesso.");
    setIsSubmitting(false);
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
