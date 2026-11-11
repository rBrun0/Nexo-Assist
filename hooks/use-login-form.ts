"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { login } from "@/lib/api/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const REMEMBER_ME_STORAGE_KEY = "nexo_remember_me";

function readRememberMePreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeRememberMePreference(value: boolean) {
  try {
    window.localStorage.setItem(
      REMEMBER_ME_STORAGE_KEY,
      value ? "true" : "false",
    );
  } catch {
    // Preferência local é best-effort; falha de storage não bloqueia o login.
  }
}

export function useLoginForm() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const preferred = readRememberMePreference();
    setRememberMeState(preferred);
    form.setValue("rememberMe", preferred);
    // Preferência local só no mount; o checkbox controla o restante.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setValue estável o bastante no mount
  }, []);

  function setRememberMe(value: boolean) {
    setRememberMeState(value);
    form.setValue("rememberMe", value);
    writeRememberMePreference(value);
  }

  async function onSubmit(values: LoginInput) {
    setFormMessage("");
    setIsSubmitting(true);
    writeRememberMePreference(values.rememberMe);

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
    rememberMe,
    setRememberMe,
  };
}
