"use client";

import { ArrowUp, Headphones } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { getEmployeeStatusUi } from "@/lib/chat/conversation-status";
import type { EmployeeConversationStatus } from "@/lib/types/employee-conversation";
import { Textarea } from "../ui/textarea";

export function EmployeeComposer({
  message,
  conversationError,
  conversationStatus,
  isSendingMessage,
  isLoadingConversation,
  isAtMessageLimit,
  isRequestingAnalyst,
  messageCount,
  messageLimit,
  onMessageChange,
  onSubmit,
  onRequestAnalyst,
}: {
  message: string;
  conversationError: string;
  conversationStatus?: EmployeeConversationStatus;
  isSendingMessage: boolean;
  isLoadingConversation: boolean;
  isAtMessageLimit: boolean;
  isRequestingAnalyst: boolean;
  messageCount: number;
  messageLimit: number;
  onMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRequestAnalyst: () => void;
}) {
  const statusUi = getEmployeeStatusUi(conversationStatus);
  const composerLocked =
    isSendingMessage ||
    isLoadingConversation ||
    isAtMessageLimit ||
    conversationStatus === "CLOSED" ||
    isRequestingAnalyst;

  const needsAnalystCta =
    isAtMessageLimit && conversationStatus === "BOT_ACTIVE";

  const limitBanner =
    isAtMessageLimit && conversationStatus === "BOT_ACTIVE"
      ? "Esta conversa atingiu o limite de 30 mensagens. Solicite um analista para continuar."
      : isAtMessageLimit
        ? "Esta conversa atingiu o limite de 30 mensagens. O analista pode encerrar para você abrir outra."
        : null;

  const placeholder = isAtMessageLimit
    ? "Limite de mensagens atingido"
    : statusUi.placeholder;

  return (
    <div className="shrink-0 border-t border-slate-200/70 bg-surface pt-3 pb-5">
      {limitBanner ? (
        <div
          role="status"
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900"
        >
          <p className="leading-5">{limitBanner}</p>
          {needsAnalystCta ? (
            <Button
              type="button"
              size="sm"
              disabled={isRequestingAnalyst || isLoadingConversation}
              onClick={onRequestAnalyst}
              className="mt-3 h-8 gap-1.5 rounded-lg bg-brand-action text-white hover:bg-brand-action-hover"
            >
              <Headphones className="size-3.5" />
              {isRequestingAnalyst
                ? "Solicitando analista..."
                : "Falar com um analista"}
            </Button>
          ) : null}
        </div>
      ) : null}
      {conversationError && !limitBanner ? (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {conversationError}
        </p>
      ) : null}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl p-2 shadow-[0_8px_30px_rgba(15,23,42,0.06)] focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 flex gap-3"
      >
        <label htmlFor="message" className="sr-only">
          Escreva sua mensagem
        </label>
        <Textarea
          id="message"
          rows={2}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          disabled={composerLocked}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!composerLocked) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          }}
          placeholder={placeholder}
          className="max-h-32 min-h-12 w-full resize-y bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || composerLocked}
            aria-label="Enviar mensagem"
            className="rounded-md bg-brand-action text-white hover:bg-brand-action-hover disabled:bg-slate-200 disabled:text-slate-400 px-3 py-2 w-20"
          >
            <ArrowUp className="size-[14px]" />
            Enviar
          </Button>
        </div>
      </form>
      <div className="w-full text-right text-xs text-slate-500 pr-3">
        {messageCount}/{messageLimit} mensagens nesta sessão
      </div>
    </div>
  );
}
