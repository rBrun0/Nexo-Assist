"use client";

import { useState } from "react";
import { KeyRound, Lock, Mail, RotateCcwKey } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { useUpdatePasswordForm } from "@/hooks/use-update-password-form";

export function EmployeeProfile({
  employee,
  showPasswordForm = false,
}: {
  employee: { name: string; email: string; initials: string };
  showPasswordForm?: boolean;
}) {
  const [isPasswordFormVisible, setIsPasswordFormVisible] =
    useState(showPasswordForm);
  const {
    register,
    handleSubmit,
    errors,
    passwordValue,
    formMessage,
    isSubmitting,
    isSuccess,
  } = useUpdatePasswordForm();

  return (
    <main className="flex flex-1 justify-center overflow-y-auto px-4 py-8 sm:px-8 sm:py-10">
      <section className="w-full max-w-2xl">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Meu perfil
          </h1>
          <p className="text-sm text-slate-500">
            Seus dados de acesso ao service desk de TI.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white overflow-x-hidden">
          <dl className="divide-y divide-slate-200 px-6 py-1">
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <dt className="text-sm text-ink-3">Nome</dt>
              <dd className="min-w-0 text-sm font-medium break-words text-slate-800">
                {employee.name}
              </dd>
              <span className="hidden sm:block" />
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
              <dt className="text-sm text-ink-3">E-mail corporativo</dt>
              <dd className="min-w-0 text-sm font-medium break-all text-slate-800">
                {employee.email}
              </dd>
              <dd className="flex items-center gap-2 text-sm text-ink-3 sm:text-right">
                <Lock className="size-4" />
                Gerenciado pela TI
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-5 rounded-t-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-desk text-slate-600">
                <KeyRound className="size-4" />
              </span>
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-slate-900">Senha</h2>
                <p className="text-xs leading-5 text-slate-500">
                  Altere a senha usada para acessar sua conta.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 cursor-pointer border-slate-200 px-3 text-ink-2"
              onClick={() => setIsPasswordFormVisible((visible) => !visible)}
            >
              <RotateCcwKey className="size-4" />
              {isPasswordFormVisible ? "Cancelar" : "Redefinir senha"}
            </Button>
          </div>
          {isPasswordFormVisible && (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <Field
                data-invalid={Boolean(errors.password)}
                className="min-w-0 flex-1 gap-1"
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nova senha (mínimo 12 caracteres)"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-logo focus:ring-2 focus:ring-blue-50"
                />
                <FieldError errors={[errors.password]} />
              </Field>
              <Button
                type="submit"
                disabled={isSubmitting || passwordValue.length < 12}
              >
                {isSubmitting ? "Salvando..." : "Salvar senha"}
              </Button>
            </form>
          )}
          {formMessage && (
            <p
              role="status"
              className={`mt-4 rounded-lg px-3 py-2 text-xs leading-5 ${
                isSuccess
                  ? "bg-blue-50 text-blue-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {formMessage}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-b-2xl border border-slate-200 bg-desk p-3 px-6 text-sm text-zinc-600">
          <Mail className="size-4" />
          <span> Enviaremos um link de redefinição para {employee.email}.</span>
        </div>
      </section>
    </main>
  );
}
