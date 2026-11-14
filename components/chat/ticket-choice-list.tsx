"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatTicketShortDate } from "@/lib/chat/format-ticket-short-date";
import {
  formatTicketStatusLabel,
  getTicketStatusTone,
  getTicketStatusToneClasses,
} from "@/lib/i18n/ticket-labels";
import type {
  TicketChoiceIntent,
  TicketChoiceItem,
} from "@/lib/validations/chat-metadata";
import { cn } from "@/lib/utils";

export function TicketChoiceList({
  tickets,
  intent,
  disabled = false,
  onSelect,
}: {
  tickets: TicketChoiceItem[];
  intent: TicketChoiceIntent;
  disabled?: boolean;
  onSelect: (ticket: TicketChoiceItem, intent: TicketChoiceIntent) => void;
}) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(() =>
    tickets.length === 1 ? tickets[0].id : "",
  );

  if (tickets.length === 0) return null;

  const selected = tickets.find((ticket) => ticket.id === selectedTicketId);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Selecione um chamado">
        {tickets.map((ticket, index) => {
          const inputId = `ticket-choice-${ticket.id}`;
          const isSelected = selectedTicketId === ticket.id;
          const tone = getTicketStatusTone(ticket.status);
          const toneClasses = getTicketStatusToneClasses(tone);

          const isFirst = index === 0;
          const isLast = index === tickets.length - 1;

          return (
            <label
              key={ticket.id}
              htmlFor={inputId}
              className={cn(
                "flex cursor-pointer items-start gap-3 border px-3 py-2.5 transition-colors",
                // isSelected
                //   ? "border-blue-300 bg-blue-50/70"
                //   : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40",
                "border-slate-200 bg-slate-50 hover:bg-slate-100",
                isSelected && "bg-slate-100",
                disabled && "pointer-events-none opacity-50",
                isFirst && "rounded-t-xl",
                isLast && "rounded-b-xl",
              )}
            >
              <input
                id={inputId}
                type="radio"
                name="ticket-choice"
                value={ticket.id}
                checked={isSelected}
                disabled={disabled}
                onChange={() => setSelectedTicketId(ticket.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSelected
                    ? "border-brand-action bg-brand-action"
                    : "border-slate-300 bg-white",
                )}
              >
                {isSelected ? (
                  <span className="size-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <div className="grid w-full grid-cols-12 items-center gap-3">
                <div className="col-span-8 flex min-w-0 items-center gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide text-slate-500">
                      {ticket.code}
                    </span>
                  </div>
                  <div className="truncate text-sm font-medium text-slate-800">
                    {ticket.title}
                  </div>
                </div>
                <div
                  className={cn(
                    "col-span-4 w-full flex items-center gap-2 justify-end text-xs text-slate-500",
                    // toneClasses.text,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      toneClasses.dot,
                    )}
                  />
                  <span>{formatTicketStatusLabel(ticket.status)}</span>
                  {ticket.updatedAt ? (
                    <span className="text-slate-500">
                      {formatTicketShortDate(ticket.updatedAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !selected}
          onClick={() => {
            if (!selected) return;
            onSelect(selected, intent);
          }}
          className="h-8 rounded-md px-3 text-[11px] font-semibold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
