"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { NexoMark } from "@/components/brand/nexo-mark";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLoginForm } from "@/hooks/use-login-form";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, errors, formMessage, isSubmitting } =
    useLoginForm();

  return (
    <main className="relative grid min-h-svh bg-white lg:grid-cols-2">
      <p className="absolute top-4 right-4 z-20 max-w-[min(100%-2rem,18rem)] text-right text-[11px] leading-4 text-slate-500 sm:top-6 sm:right-6 sm:text-xs">
        Problemas para entrar? Ligue no ramal 4000
      </p>
      <p className="absolute bottom-4 left-4 z-20 text-[11px] leading-4 text-slate-400 sm:bottom-6 sm:left-6 sm:text-xs">
        © 2026 Nexo - Service desk de TI
      </p>
      <a
        href="#"
        className="absolute right-4 bottom-4 z-20 text-[11px] leading-4 text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline sm:right-6 sm:bottom-6 sm:text-xs"
      >
        Privacidade e uso de dados
      </a>

      <section className="relative hidden min-h-svh overflow-hidden bg-background-login px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        {/* <div className="absolute inset-0" />
        <div className="absolute -top-32 -right-36 size-[520px] rounded-full border border-white/10" />
        <div className="absolute -top-12 -right-16 size-[360px] rounded-full border border-white/10" />
        <div className="absolute right-10 bottom-16 size-64 rounded-full border border-white/10" /> */}

        <div className="relative z-10 flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <NexoMark size={36} priority className="size-9" />
          <span>
            Nexo <span className="text-sky-300">Assist</span>
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-xl py-10">
          <div className="mb-3 text-sm font-medium text-blue-100/70">
            Service desk de TI da Nexo
          </div>
          <h1 className="max-w-lg text-4xl leading-[1.13] font-semibold tracking-[-0.04em] xl:text-5xl">
            Seu problema de TI,{" "}
            <span>resolvido em uma conversa.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-5 text-blue-100/80">
            Descreva o que está acontecendo. O assistente consulta seus chamados, busca na central de ajuda e chama um analista quando precisa.
          </p>

          <div className="mt-5 max-w-md rounded-2xl border border-white/15 bg-white/10 px-5 py-3 shadow-2xl shadow-slate-950/10 backdrop-blur-md">
            <div className="mt-5 w-fit rounded-xl rounded-tl-sm bg-white px-4 py-2 text-xs leading-5 text-slate-600 shadow-sm ml-auto">
              Meu notebook não conecta na VPN. Erro 809
            </div>
            <div className="flex flex-col w-full mt-5">
            <div className="w-fit rounded-xl rounded-tl-sm bg-white px-4 py-2 text-xs leading-5 shadow-sm bg-white/20 text-white">
              Pronto. Abri o chamado com prioridade alta. Um analista fala com você em até 4h úteis.
            </div>
            <div className="w-fit rounded-xl bg-white px-4 py-1 text-xs leading-5 text-slate-600 shadow-sm gap-1 flex items-center">
             <span className="rounded-full bg-orange-300 p-1"></span>  <span><b>INC-20517</b> Rede e VPN Alta em até 4 h</span>
            </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mb-6 max-w-xl">
          <Separator className="bg-white/20" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-white">8 s</p>
              <p className="mt-1 text-[10px] leading-4 text-blue-100/70 sm:text-xs">
                Primeira resposta, em média
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">72%</p>
              <p className="mt-1 text-[10px] leading-4 text-blue-100/70 sm:text-xs">
                Resolvidos sem fila
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">6</p>
              <p className="mt-1 text-[10px] leading-4 text-blue-100/70 sm:text-xs">
                Analistas online agora
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-100/55">
          Nexo Assist · Suporte de TI para você
        </p>
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-6 pt-14 pb-16 sm:px-10 lg:px-12">
        <div className="w-full max-w-[410px]">
          <div className="mb-12 flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 lg:hidden">
            <NexoMark size={36} priority className="size-9" />
            <span>
              Nexo <span className="text-brand-logo">Assist</span>
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-action">
              Bem-vindo(a) de volta
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-900">
              Acesse sua conta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Entre com suas credenciais corporativas para continuar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 space-y-5"
          >
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel
                htmlFor="corporate-email"
                className="text-sm font-medium text-slate-700"
              >
                E-mail corporativo
              </FieldLabel>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400"
                />
                <Input
                  id="corporate-email"
                  type="email"
                  autoComplete="username"
                  placeholder="voce@nexo.com.br"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                  className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm placeholder:text-slate-400 focus-visible:border-brand-logo focus-visible:ring-brand-logo/20"
                />
              </div>
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.password)}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Senha
                </FieldLabel>
              </div>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                  className="h-12 rounded-xl border-slate-200 bg-white pr-11 pl-10 text-sm shadow-sm placeholder:text-slate-400 focus-visible:border-brand-logo focus-visible:ring-brand-logo/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-logo"
                >
                  {showPassword ? (
                    <EyeOff className="size-[17px]" />
                  ) : (
                    <Eye className="size-[17px]" />
                  )}
                </button>
              </div>
              <FieldError errors={[errors.password]} />
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full gap-2 rounded-xl bg-brand-action text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:bg-brand-action-hover"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
              <ArrowRight className="size-4" />
            </Button>

            {formMessage && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-800"
              >
                {formMessage}
              </p>
            )}
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Acesso exclusivo para colaboradores Nexo.
            <br />
            Em caso de dificuldade, entre em contato com o Service Desk.
          </p>
        </div>
      </section>
    </main>
  );
}
