"use client";

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
};

export function TicketStatusCard({ ticket }: { ticket: TicketStatusTicket }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500">
        {ticket.code} · {formatTicketStatusLabel(ticket.status)}
        {ticket.isOverdue ? " · SLA vencido" : ""}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{ticket.title}</p>
      {ticket.description ? (
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[12px] leading-5 text-slate-600">
          {ticket.description}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-500">
        {formatTicketCategoryLabel(ticket.category)} ·{" "}
        {formatTicketPriorityLabel(ticket.priority)}
        {ticket.slaDeadline
          ? ` · SLA ${new Date(ticket.slaDeadline).toLocaleString("pt-BR")}`
          : ""}
      </p>
    </div>
  );
}
