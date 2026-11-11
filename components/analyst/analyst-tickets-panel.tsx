"use client";

import { useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTicketLastEvent } from "@/lib/analyst/ticket-last-event";
import {
  type AnalystConversationListItem,
  type AnalystTicketItem,
} from "@/lib/analyst/map-conversation";
import {
  getTicketStatusTone,
  getTicketStatusToneClasses,
} from "@/lib/i18n/ticket-labels";
import { cn } from "@/lib/utils";

const OTHER_TICKETS_PREVIEW = 2;

function TicketStatusLabel({
  status,
  statusKey,
}: {
  status: string;
  statusKey: string;
}) {
  const tone = getTicketStatusToneClasses(getTicketStatusTone(statusKey));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-medium",
        tone.text,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", tone.dot)} />
      {status}
    </span>
  );
}

function TicketLastEventRow({ statusKey }: { statusKey: string }) {
  const event = getTicketLastEvent(statusKey);
  const Icon = event.icon;

  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-600">
      <Icon className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      <span>{event.label}</span>
    </div>
  );
}

function FeaturedTicketCard({
  ticket,
  canManage,
  isUpdating,
  onStatusChange,
}: {
  ticket: AnalystTicketItem;
  canManage: boolean;
  isUpdating: boolean;
  onStatusChange?: (ticketId: string, status: string) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold tracking-wide text-brand-action">
          {ticket.code}
        </span>
        <TicketStatusLabel
          status={ticket.status}
          statusKey={ticket.statusKey}
        />
      </div>
      <h3 className="mt-2.5 text-[13px] leading-5 font-semibold text-slate-900">
        {ticket.title}
      </h3>
      <p className="mt-1 text-[10px] text-slate-400">{ticket.category}</p>
      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <TicketLastEventRow statusKey={ticket.statusKey} />
      </div>
      {canManage && onStatusChange ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ticket.statusKey !== "IN_PROGRESS" ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onStatusChange(ticket.id, "IN_PROGRESS")}
              className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Em andamento
            </button>
          ) : null}
          {ticket.statusKey !== "RESOLVED" ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onStatusChange(ticket.id, "RESOLVED")}
              className="rounded-md border border-emerald-200 px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              Resolver
            </button>
          ) : null}
          {ticket.statusKey !== "WAITING_ANALYST" ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onStatusChange(ticket.id, "WAITING_ANALYST")}
              className="rounded-md border border-amber-200 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              Aguardar analista
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function OtherTicketDetails({ ticket }: { ticket: AnalystTicketItem }) {
  return (
    <div className="space-y-2 px-1 pb-1 text-[11px] text-slate-600">
      <p>
        <span className="text-slate-400">Categoria:</span> {ticket.category}
      </p>
      <p>
        <span className="text-slate-400">Prioridade:</span> {ticket.priority}
      </p>
      {ticket.updatedAt ? (
        <p>
          <span className="text-slate-400">Atualizado:</span> {ticket.updatedAt}
        </p>
      ) : null}
      <TicketLastEventRow statusKey={ticket.statusKey} />
    </div>
  );
}

function OtherTicketsList({ tickets }: { tickets: AnalystTicketItem[] }) {
  return (
    <Accordion className="gap-2">
      {tickets.map((ticket) => (
        <AccordionItem
          key={ticket.id}
          value={ticket.id}
          className="rounded-xl bg-white px-3 not-last:border-b"
        >
          <AccordionTrigger className="items-center gap-2 py-3 hover:no-underline">
            <div className="flex items-center justify-start gap-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", {
                  "bg-slate-600": ticket.status === "Aguardando analista",
                  "bg-emerald-600": ticket.status === "Resolvido",
                  "bg-amber-600": ticket.status === "Fechado",
                  "bg-blue-600": ticket.status === "Em atendimento",
                  "bg-red-600": ticket.status === "Cancelado",
                  "bg-gray-600": ticket.status === "Encerrado",
                  "bg-purple-600": ticket.status === "Em revisão",
                  "bg-orange-600": ticket.status === "Em espera",
                  "bg-green-600": ticket.status === "Aprovado",
                })}
              />
              <span className="min-w-0 flex-1 pr-2">
                <span className="block truncate text-wrap text-[12px] font-semibold text-slate-800">
                  {ticket.title}
                </span>
                <span className="mt-1 flex items-center justify-start gap-2">
                  <span className="truncate text-[10px] text-slate-500">
                    {ticket.code}
                  </span>
                  <span className="size-1 shrink-0 rounded-full bg-slate-400" />
                  <span className="text-[10px] text-slate-500">
                    {ticket.status}
                  </span>
                </span>
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <OtherTicketDetails ticket={ticket} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function AnalystTicketsPanel({
  conversation,
  currentAnalystId,
  onTicketStatusChange,
  className,
}: {
  conversation: AnalystConversationListItem;
  currentAnalystId?: string;
  onTicketStatusChange?: (ticketId: string, status: string) => Promise<void>;
  className?: string;
}) {
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [trackedConversationId, setTrackedConversationId] = useState(
    conversation.id,
  );
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);

  if (trackedConversationId !== conversation.id) {
    setTrackedConversationId(conversation.id);
    setShowAllTickets(false);
  }

  const canManageTickets =
    conversation.status === "Em atendimento" &&
    Boolean(currentAnalystId) &&
    conversation.assignedAnalystId === currentAnalystId;

  async function handleStatusChange(ticketId: string, status: string) {
    if (!onTicketStatusChange || isUpdatingTicket) return;
    setIsUpdatingTicket(true);
    try {
      await onTicketStatusChange(ticketId, status);
    } finally {
      setIsUpdatingTicket(false);
    }
  }

  const firstName = conversation.name.split(" ")[0] || conversation.name;
  const totalTickets = conversation.tickets.length;
  const closedTickets = conversation.tickets.filter(
    (ticket) => ticket.status === "Resolvido" || ticket.status === "Fechado",
  ).length;
  const ticketsLabel =
    totalTickets === 1 ? "1 chamado" : `${totalTickets} chamados`;
  const closedLabel =
    closedTickets === 1 ? "1 encerrado" : `${closedTickets} encerrados`;
  const conversationTicketCode = conversation.conversationTicket?.code ?? null;
  const conversationTicketCard =
    conversation.tickets.find(
      (ticket) => ticket.code === conversationTicketCode,
    ) ??
    (conversation.conversationTicket
      ? ({
          id: conversation.conversationTicket.id,
          code: conversation.conversationTicket.code,
          title: conversation.conversationTicket.title,
          category: "—",
          priority: "Baixa" as const,
          status: "Aguardando analista",
          statusKey: "WAITING_ANALYST",
          updatedAt: "",
        } satisfies AnalystTicketItem)
      : null);
  const otherTickets = conversation.tickets.filter(
    (ticket) => ticket.code !== conversationTicketCode,
  );
  const visibleOtherTickets = useMemo(
    () =>
      showAllTickets
        ? otherTickets
        : otherTickets.slice(0, OTHER_TICKETS_PREVIEW),
    [otherTickets, showAllTickets],
  );
  const hasMoreOtherTickets = otherTickets.length > OTHER_TICKETS_PREVIEW;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-md font-semibold">Chamados de {firstName}</p>
        <p className="text-xs font-medium text-slate-500">
          {ticketsLabel} · {closedLabel}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3">
        <section className="space-y-2">
          <p className="px-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
            Desta conversa
          </p>
          {conversationTicketCard ? (
            <FeaturedTicketCard
              ticket={conversationTicketCard}
              canManage={canManageTickets}
              isUpdating={isUpdatingTicket}
              onStatusChange={(ticketId, status) => {
                void handleStatusChange(ticketId, status);
              }}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
              Nenhum chamado vinculado a esta conversa.
            </p>
          )}
        </section>
        <section className="space-y-2">
          <p className="px-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
            Outros chamados
          </p>
          {otherTickets.length > 0 ? (
            <OtherTicketsList tickets={visibleOtherTickets} />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
              Sem outros chamados deste funcionário.
            </p>
          )}
        </section>
      </div>
      {hasMoreOtherTickets ? (
        <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-3">
          <button
            type="button"
            onClick={() => setShowAllTickets((current) => !current)}
            className="w-full rounded-lg px-2 py-2 text-center text-[12px] font-medium text-brand-action transition-colors hover:bg-brand-action/5"
          >
            {showAllTickets
              ? "Mostrar menos chamados"
              : "Ver todos os chamados..."}
          </button>
        </div>
      ) : null}
    </div>
  );
}
