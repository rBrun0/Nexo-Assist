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
  showDemoAccounts = false,
}: {
  resolvedWithoutQueuePercent: number;
  showDemoAccounts?: boolean;
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
          <NexoMark size={24} priority className="size-9" />
          <span>Nexo Assist</span>
        </div>

        <div className="relative z-10 my-auto max-w-xl py-10">
          <div className="mb-3 text-sm text-zinc-400">
            Service desk de TI da Nexo
          </div>
          <h1 className="font-newsreader max-w-lg text-4xl leading-[1.13] tracking-[-0.04em] xl:text-5xl">
            <span className="text-nowrap">Seu problema de TI, resolvido</span>{" "}
            <br /> <span>em uma conversa.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">
            Descreva o que está acontecendo. O assistente consulta seus <br />
            chamados, busca na central de ajuda e chama um analista quando{" "}
            <br />
            precisa.
          </p>

          <div className="mt-5 ml-auto max-w-md rounded-2xl border border-white/15 bg-background-login brightness-120 px-5 py-3 shadow-2xl shadow-slate-950/10 backdrop-blur-md">
            <div className="mt-5 ml-auto w-fit rounded-xl rounded-tl-sm bg-white px-4 py-2 text-xs leading-5 text-slate-800 shadow-sm font-medium">
              Meu notebook não conecta na VPN. Erro 809
            </div>
            <div className="mt-7 flex w-full flex-col relative">
              <div className="absolute -top-5 left-2 text-xs">
                <span className="text-white/80">Nexo assist</span>{" "}
                <span className="text-zinc-400">consultou seus chamados</span>{" "}
                <span className="text-zinc-400">-</span>{" "}
                <span className="text-zinc-400">criou um chamado</span>
              </div>
              <div className="w-fit rounded-xl rounded-tl-sm bg-gray-800 px-4 py-2 text-xs leading-5 text-white shadow-sm">
                Pronto. Abri o chamado com prioridade alta. Um analista fala com
                você em até 4h úteis.
              </div>
              <div className="flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-1 text-xs leading-5 text-slate-700 shadow-sm">
                <span className="rounded-full bg-orange-300 p-1" />{" "}
                <span>
                  <b>INC-20517</b> Rede e VPN - Alta - em até 4 h
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mb-6 max-w-xl">
          <Separator className="bg-white/10" />
          <div className="mt-5 grid grid-cols-3 divide-x divide-white/10">
            <div className="px-3 text-center font-newsreader first:pl-0 last:pr-0">
              <p className="pl-6 text-left text-3xl text-white">8 s</p>
              <p className="mt-1 text-center text-[10px] leading-4 text-zinc-400 sm:text-xs">
                Primeira resposta, em média
              </p>
            </div>
            <div className="px-3 text-center font-newsreader first:pl-0 last:pr-0">
              <p className="pl-11 text-left text-3xl text-white">
                {resolvedWithoutQueuePercent}%
              </p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs">
                Resolvidos sem fila
              </p>
            </div>
            <div className="px-3 text-center font-newsreader first:pl-0 last:pr-0">
              <p className="flex items-center gap-2 pl-9 text-left text-3xl text-white">
                <span>{onlineAnalystsCount}</span>
                <span className="rounded-full bg-green-500 p-1" />
              </p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs">
                Analistas online agora
              </p>
            </div>
          </div>
        </div>

        {/* <p className="relative z-10 text-xs text-blue-100/55">
          Nexo Assist · Suporte de TI para você
        </p> */}
      </section>

      <section className="relative flex h-full min-h-0 flex-col overflow-hidden px-6 pt-14 pb-14 sm:px-10 lg:px-12">
        <p className="absolute top-4 right-4 z-20 max-w-[min(100%-2rem,18rem)] text-right text-[11px] leading-4 sm:top-6 sm:right-6 sm:text-xs text-zinc-600">
          Problemas para entrar?{" "}
          <span className="font-medium text-brand-action">
            Ligue no ramal 4000
          </span>
        </p>
        <p className="absolute bottom-4 left-4 z-20 text-[11px] leading-4 text-slate-600 sm:bottom-10 sm:left-12 sm:text-xs">
          © 2026 Nexo - Service desk de TI
        </p>
        <a
          href="#"
          className="absolute right-4 bottom-4 z-20 text-[11px] leading-4 text-slate-600 underline-offset-2 hover:text-slate-600 hover:underline sm:right-12 sm:bottom-10 sm:text-xs"
        >
          Privacidade e uso de dados
        </a>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto   py-2">
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
              {showDemoAccounts ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  Ambiente de demonstração: as contas de exemplo aceitam qualquer
                  senha.{" "}
                  <span className="font-medium text-slate-700">
                    carlos.silva@nexo.com.br
                  </span>
                  ,{" "}
                  <span className="font-medium text-slate-700">
                    ana.souza@nexo.com.br
                  </span>{" "}
                  ou{" "}
                  <span className="font-medium text-slate-700">
                    analista.ti@nexo.com.br
                  </span>
                  .
                </p>
              ) : null}
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
                  Manter me conectado neste computador
                </Label>
              </div>

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
