"use client";

import { useState } from "react";
import { KeyRound, RotateCcwKey } from "lucide-react";

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
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Meu perfil
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Seus dados de acesso ao service desk de TI.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <dl className="divide-y divide-slate-100 px-6 py-1">
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <dt className="text-sm text-slate-500">Nome</dt>
              <dd className="min-w-0 text-sm font-medium break-words text-slate-800">
                {employee.name}
              </dd>
              <span className="hidden sm:block" />
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
              <dt className="text-sm text-slate-500">E-mail corporativo</dt>
              <dd className="min-w-0 text-sm font-medium break-all text-slate-800">
                {employee.email}
              </dd>
              <dd className="text-sm text-slate-500 sm:text-right">
                Gerenciado pela TI
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-5 rounded-t-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Senha</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Altere a senha usada para acessar sua conta.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 cursor-pointer border-slate-200 text-slate-600"
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
        <div className="rounded-b-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          Enviaremos um link de redefinição para {employee.email}.
        </div>
      </section>
    </main>
  );
}
