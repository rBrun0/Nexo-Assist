"use client";

import { Hand, Headset, Send } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAnalystFooterUi } from "@/lib/analyst/analyst-footer-ui";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

type WorkingAction = "claim" | "return_to_bot" | "close" | "send_message" | null;

export function AnalystChatFooter({
  conversation,
  firstName,
  handoffUntil,
  draft,
  isWorking,
  workingAction,
  currentAnalystId,
  onDraftChange,
  onPerformAction,
  onSendMessage,
  onTypingActivity,
}: {
  conversation: AnalystConversationListItem;
  firstName: string;
  handoffUntil: string | null;
  draft: string;
  isWorking: boolean;
  workingAction: WorkingAction;
  currentAnalystId: string;
  onDraftChange: (value: string) => void;
  onPerformAction: (action: "claim" | "return_to_bot" | "close") => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  onTypingActivity?: () => void;
}) {
  const footerUi = getAnalystFooterUi({
    status: conversation.status,
    assignedAnalystId: conversation.assignedAnalystId,
    currentAnalystId,
  });

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
      {footerUi.showWaitingBanner ? (
        <div className="mb-3 flex flex-col gap-3 rounded-lg px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10">
              <Hand className="size-4 text-amber-800" />
            </div>
            <div className="flex flex-col text-sm font-semibold">
              <div>{firstName} está à espera de um atendente</div>
              <div className="text-xs font-normal text-zinc-500">
                <span>Agent pausado</span>
                {handoffUntil ? (
                  <span>
                    {" "}
                    · {handoffUntil === "prazo vencido" ? handoffUntil : `até ${handoffUntil}`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {footerUi.showClaimAction ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="lg"
                disabled={isWorking}
                onClick={() => onPerformAction("claim")}
                className="h-8 text-[11px]"
              >
                <Headset className="size-3" />
                <span>{workingAction === "claim" ? "Assumindo..." : "Assumir atendimento"}</span>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={onSendMessage} className="flex items-end gap-2">
        <label htmlFor="analyst-message" className="sr-only">
          Escreva uma resposta
        </label>
        <Input
          id="analyst-message"
          value={draft}
          onChange={(event) => {
            onDraftChange(event.target.value);
            if (event.target.value.trim()) onTypingActivity?.();
          }}
          disabled={isWorking || !footerUi.canCompose}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={footerUi.placeholder}
          className="max-h-32 min-h-11 flex-1 resize-y text-xs leading-5"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || isWorking || !footerUi.canCompose}
          aria-label="Enviar resposta"
          className="size-10 shrink-0 rounded-full bg-brand-action text-white hover:bg-brand-action-hover disabled:bg-slate-200 disabled:text-slate-400"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
