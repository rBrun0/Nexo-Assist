"use client";

import type { FormEvent } from "react";
import { Bot, Hand, Headset, Send } from "lucide-react";

import { getAnalystFooterUi } from "@/lib/analyst/analyst-footer-ui";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WorkingAction =
  | "claim"
  | "return_to_bot"
  | "close"
  | "send_message"
  | null;

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
            <div className="size-9 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Hand className="size-4 text-amber-800" />
            </div>
            <div className="text-sm font-semibold flex flex-col">
              <div>{firstName} está à espera de um atendente</div>
              <div className="text-xs text-zinc-500 font-normal">
                <span>Agent pausado</span>
                {handoffUntil ? (
                  <span>
                    {" "}
                    ·{" "}
                    {handoffUntil === "prazo vencido"
                      ? handoffUntil
                      : `até ${handoffUntil}`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AlertDialog>
              <AlertDialog.Trigger>
                <Button
                  type="button"
                  size={"lg"}
                  variant="outline"
                  disabled={isWorking}
                  className="h-8 bg-white text-[11px]"
                >
                  <Bot className="size-3" />
                  <span>
                    {workingAction === "return_to_bot"
                      ? "Devolvendo..."
                      : "Devolver ao agent"}
                  </span>
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Devolver ao agent?</AlertDialog.Title>
                  <AlertDialog.Description>
                    A fila de espera será cancelada e o Nexo Assist retomará o
                    atendimento.
                  </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
                  <AlertDialog.Action
                    onClick={() => onPerformAction("return_to_bot")}
                  >
                    Confirmar devolução
                  </AlertDialog.Action>
                </AlertDialog.Footer>
              </AlertDialog.Content>
            </AlertDialog>
            <Button
              type="button"
              size="sm"
              disabled={isWorking}
              onClick={() => onPerformAction("claim")}
              className="h-8 text-[11px]"
            >
              <Headset className="size-3" />
              <span>
                {workingAction === "claim"
                  ? "Assumindo..."
                  : "Assumir atendimento"}
              </span>
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSendMessage} className="flex items-end gap-2">
        <label htmlFor="analyst-message" className="sr-only">
          Escreva uma resposta
        </label>
        <Input
          id="analyst-message"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
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
