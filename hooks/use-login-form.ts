"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { login } from "@/lib/api/auth";
import { readRememberMePreference, writeRememberMePreference } from "@/lib/auth/remember-me";
import { useLoginFields } from "@/lib/forms/use-login-fields";
import type { LoginInput } from "@/lib/validations/auth";

export function useLoginForm() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMeState] = useState(() => readRememberMePreference());
  const form = useLoginFields({ rememberMe });

  function setRememberMe(value: boolean) {
    setRememberMeState(value);
    form.setValue("rememberMe", value);
    writeRememberMePreference(value);
  }

  async function onSubmit(values: LoginInput) {
    setFormMessage("");
    setIsSubmitting(true);
    writeRememberMePreference(values.rememberMe);

    const result = await login(values);
    if (!result.success) {
      console.error("Falha na requisição de login:", result.error);
      setFormMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace(result.data.role === "ANALYST" ? "/analista" : "/servicedesk/atendimento");
    router.refresh();
    setIsSubmitting(false);
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    formMessage,
    isSubmitting,
    rememberMe,
    setRememberMe,
  };
}
