"use client";

import { Clock3, MessageSquareText } from "lucide-react";

export function AnalystChatEmptyState({
  waitingCount,
}: {
  waitingCount: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-action">
        <MessageSquareText className="size-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">
        Sua central de atendimento
      </h2>
      <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">
        Selecione uma conversa para ver o histórico, responder ao colaborador e
        consultar os chamados relacionados.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] text-slate-500 shadow-sm ring-1 ring-slate-200">
        <Clock3 className="size-3.5 text-brand-action" />
        {waitingCount === 1
          ? "1 conversa aguardando atendimento"
          : `${waitingCount} conversas aguardando atendimento`}
      </div>
    </div>
  );
}
