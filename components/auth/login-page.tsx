"use client";

import { ArrowRight, Mail } from "lucide-react";

import { NexoMark } from "@/components/brand/nexo-mark";
import { FormInputField, PasswordInputField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLoginForm } from "@/hooks/use-login-form";
import { useOnlineAnalystsCount } from "@/hooks/use-online-analysts-count";

export function LoginPage({
  resolvedWithoutQueuePercent,
}: {
  resolvedWithoutQueuePercent: number;
}) {
  const {
    register,
    handleSubmit,
    errors,
    formMessage,
    isSubmitting,
    rememberMe,
    setRememberMe,
  } = useLoginForm();
  const onlineAnalystsCount = useOnlineAnalystsCount();

  return (
    <main className="relative grid h-svh overflow-hidden bg-white lg:grid-cols-2">
      <section className="relative hidden h-full overflow-hidden bg-background-login px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
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
          <h1 className="font-newsreader max-w-lg text-4xl leading-[1.13] tracking-[-0.04em] xl:text-5xl">
            Seu problema de TI, <span>resolvido em uma conversa.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-5 text-blue-100/80">
            Descreva o que está acontecendo. O assistente consulta seus
            chamados, busca na central de ajuda e chama um analista quando
            precisa.
          </p>

          <div className="mt-5 max-w-md rounded-2xl border border-white/15 bg-white/10 px-5 py-3 shadow-2xl shadow-slate-950/10 backdrop-blur-md">
            <div className="mt-5 ml-auto w-fit rounded-xl rounded-tl-sm bg-white px-4 py-2 text-xs leading-5 text-slate-600 shadow-sm">
              Meu notebook não conecta na VPN. Erro 809
            </div>
            <div className="mt-5 flex w-full flex-col">
              <div className="w-fit rounded-xl rounded-tl-sm bg-white/20 px-4 py-2 text-xs leading-5 text-white shadow-sm">
                Pronto. Abri o chamado com prioridade alta. Um analista fala com
                você em até 4h úteis.
              </div>
              <div className="flex w-fit items-center gap-1 rounded-xl bg-white px-4 py-1 text-xs leading-5 text-slate-600 shadow-sm">
                <span className="rounded-full bg-orange-300 p-1" />{" "}
                <span>
                  <b>INC-20517</b> Rede e VPN Alta em até 4 h
                </span>
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
              <p className="text-sm font-semibold text-white">
                {resolvedWithoutQueuePercent}%
              </p>
              <p className="mt-1 text-[10px] leading-4 text-blue-100/70 sm:text-xs">
                Resolvidos sem fila
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                {onlineAnalystsCount}
              </p>
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

      <section className="relative flex h-full min-h-0 flex-col overflow-hidden px-6 pt-14 pb-14 sm:px-10 lg:px-12">
        <p className="absolute top-4 right-4 z-20 max-w-[min(100%-2rem,18rem)] text-right text-[11px] leading-4 text-slate-500 sm:top-6 sm:right-6 sm:text-xs">
          Problemas para entrar? Ligue no ramal{" "}
          <span className="text-brand-action">4000</span>
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

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-2">
          <div className="w-full max-w-[410px]">
            <div className="mb-12 flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 lg:hidden">
              <NexoMark size={36} priority className="size-9" />
              <span>
                Nexo <span className="text-brand-logo">Assist</span>
              </span>
            </div>

            <div>
              {/* <p className="text-sm font-medium text-brand-action">
                Bem-vindo(a) de volta
              </p> */}
              <h2 className="font-newsreader text-4xl tracking-[-0.035em] text-slate-900">
                Entrar
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Use seu e-mail corporativo e a senha da rede Nexo.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <FormInputField
                id="corporate-email"
                label="E-mail corporativo"
                type="email"
                autoComplete="username"
                placeholder="voce@nexo.com.br"
                error={errors.email}
                leadingIcon={Mail}
                {...register("email")}
              />

              <PasswordInputField
                id="password"
                label="Senha"
                placeholder="Digite sua senha"
                error={errors.password}
                labelAction={
                  <a
                    href="#"
                    className="text-xs font-medium text-brand-action transition-colors hover:text-brand-action-hover"
                  >
                    Esqueci minha senha
                  </a>
                }
                {...register("password")}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full gap-2 rounded-xl bg-brand-action text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:bg-brand-action-hover"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
                <ArrowRight className="size-4" />
              </Button>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="remember-me"
                  className="cursor-pointer text-sm font-normal text-slate-600"
                >
                  Manter me conectado nesse computador
                </Label>
              </div>

              {formMessage && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-800"
                >
                  {formMessage}
                </p>
              )}
            </form>

            {/* <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Acesso exclusivo para colaboradores Nexo.
              <br />
              Em caso de dificuldade, entre em contato com o Service Desk.
            </p> */}
          </div>
        </div>
      </section>
    </main>
  );
}
