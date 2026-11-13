"use client";

import { ItemLabel } from "@/components/ui/item-label";
import { Separator } from "@/components/ui/separator";
import {
  formatTicketLastUpdateLabel,
  formatTicketOpenedAt,
} from "@/lib/chat/format-ticket-short-date";
import {
  formatTicketCategoryLabel,
  formatTicketPriorityLabel,
  formatTicketStatusLabel,
} from "@/lib/i18n/ticket-labels";
import type { TicketChoiceItem } from "@/lib/validations/chat-metadata";

type TicketStatusTicket = TicketChoiceItem & {
  description?: string;
  isOverdue?: boolean;
  slaDeadline?: string | null;
  createdAt?: string;
};

function formatSlaDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

export function TicketStatusCard({ ticket }: { ticket: TicketStatusTicket }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-700">
      <p className="text-[12.5px] tracking-wide text-slate-500">
        Chamado <span className="text-slate-200">·</span> {ticket.code} ·{" "}
        {formatTicketStatusLabel(ticket.status)}
      </p>
      <p className="mt-1 text-lg font-medium text-slate-800">{ticket.title}</p>
      {ticket.description ? (
        <p className="line-clamp-4 whitespace-pre-wrap text-[13.5px] leading-5 text-zinc-600">
          {ticket.description}
        </p>
      ) : null}
      <Separator className="my-3" />
      <div className="grid grid-cols-4 gap-x-4 gap-y-3">
        <ItemLabel
          title="Categoria"
          value={formatTicketCategoryLabel(ticket.category)}
        />
        <ItemLabel
          title="Prioridade"
          value={
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-zinc-400" />
              <span>{formatTicketPriorityLabel(ticket.priority)}</span>
            </div>
          }
        />
        {ticket.slaDeadline ? (
          <ItemLabel title="SLA" value={formatSlaDeadline(ticket.slaDeadline)} />
        ) : null}
        {ticket.createdAt ? (
          <ItemLabel
            title="Aberto em"
            value={formatTicketOpenedAt(ticket.createdAt)}
          />
        ) : null}
        {ticket.updatedAt ? (
          <ItemLabel
            title="Última atualização"
            value={formatTicketLastUpdateLabel(ticket.updatedAt, {
              isOverdue: ticket.isOverdue,
            })}
          />
        ) : null}
      </div>
    </div>
  );
}
