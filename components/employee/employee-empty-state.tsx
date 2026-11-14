"use client";

import { BookOpen, ChevronRight, CircleHelp, Wifi } from "lucide-react";

const suggestions = [
  {
    icon: Wifi,
    title: "Estou com problemas na VPN",
    description: "Ajuda com conexão e acesso remoto",
  },
  {
    icon: BookOpen,
    title: "Como solicitar um acesso?",
    description: "Encontre o sistema ou recurso que precisa",
  },
  {
    icon: CircleHelp,
    title: "Preciso de outra ajuda",
    description: "Conte para a gente o que está acontecendo",
  },
];

export function EmployeeEmptyState({
  firstName,
  endedNotice = false,
  onSuggestionSelect,
}: {
  firstName: string;
  endedNotice?: boolean;
  onSuggestionSelect: (title: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col justify-center pb-8 pt-6 md:pt-0">
      <p className="text-sm font-medium text-brand-logo">Olá, {firstName}!</p>
      <h1 className="max-w-[540px] text-[32px] leading-[1.18] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[40px]">
        Como podemos facilitar seu dia?
      </h1>
      <p className="max-w-lg text-sm leading-6 text-slate-500">
        {endedNotice
          ? "Atendimento encerrado. Envie uma mensagem para começar outro."
          : "Tire dúvidas, resolva problemas de TI ou acompanhe seus chamados. É só começar por aqui."}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {suggestions.map(({ icon: Icon, title, description }) => (
          <button
            key={title}
            type="button"
            onClick={() => onSuggestionSelect(title)}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <span className="mb-4 flex size-8 items-center justify-center rounded-lg bg-blue-50 text-brand-action transition-colors group-hover:bg-blue-100">
              <Icon className="size-4" />
            </span>
            <span className="flex items-center justify-between gap-2 text-[12px] leading-5 font-semibold text-slate-800">
              {title}
              <ChevronRight className="size-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-action" />
            </span>
            <span className="mt-1 block text-[11px] leading-[18px] text-slate-500">
              {description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
