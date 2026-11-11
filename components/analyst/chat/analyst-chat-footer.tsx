"use client";

import type { FormEvent } from "react";
import { Send } from "lucide-react";

import { getAnalystFooterUi } from "@/lib/analyst/analyst-footer-ui";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type WorkingAction =
  | "claim"
  | "return_to_bot"
  | "close"
  | "send_message"
  | null;

export function AnalystChatFooter({
  conversation,
  firstName,
  handoffSince,
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
  handoffSince: string | null;
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
        <div className="mb-3 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-amber-900">
            <span className="font-semibold">{firstName}</span> está à espera de
            um atendente
            <span className="text-amber-700"> · agente pausado</span>
            {handoffSince ? (
              <span className="text-amber-700"> · desde {handoffSince}</span>
            ) : null}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <AlertDialog>
              <AlertDialog.Trigger>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isWorking}
                  className="h-8 border-amber-300 bg-white text-[11px] text-amber-900 hover:bg-amber-100"
                >
                  {workingAction === "return_to_bot"
                    ? "Devolvendo..."
                    : "Devolver ao agente"}
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Devolver ao agente?</AlertDialog.Title>
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
              {workingAction === "claim"
                ? "Assumindo..."
                : "Assumir atendimento"}
            </Button>
          </div>
        </div>
      ) : null}

      {footerUi.showAssignedToolbar ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            Você está atendendo {firstName}.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <AlertDialog>
              <AlertDialog.Trigger>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isWorking}
                  className="h-8 text-[11px]"
                >
                  {workingAction === "return_to_bot"
                    ? "Devolvendo..."
                    : "Devolver ao agente"}
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Devolver ao agente?</AlertDialog.Title>
                  <AlertDialog.Description>
                    O Nexo Assist volta a atender esta conversa e você deixa de
                    controlar o chat.
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
            <AlertDialog>
              <AlertDialog.Trigger>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isWorking}
                  className="h-8 text-[11px] text-red-600"
                >
                  {workingAction === "close"
                    ? "Encerrando..."
                    : "Encerrar atendimento"}
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Encerrar atendimento?</AlertDialog.Title>
                  <AlertDialog.Description>
                    A conversa será encerrada e o colaborador não poderá
                    continuar neste atendimento.
                  </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
                  <AlertDialog.Action onClick={() => onPerformAction("close")}>
                    Encerrar
                  </AlertDialog.Action>
                </AlertDialog.Footer>
              </AlertDialog.Content>
            </AlertDialog>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSendMessage} className="flex items-end gap-2">
        <label htmlFor="analyst-message" className="sr-only">
          Escreva uma resposta
        </label>
        <Textarea
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
          rows={2}
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
