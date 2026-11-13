"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Bot,
  CircleCheckBig,
  MoreHorizontal,
  MoreVertical,
  Search,
  X,
} from "lucide-react";

import { ConversationStatusChip } from "@/components/analyst/chat/conversation-status-chip";
import { UserAvatar } from "@/components/chat/user-avatar";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { getAnalystFooterUi } from "@/lib/analyst/analyst-footer-ui";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { cn } from "@/lib/utils";

type WorkingAction =
  | "claim"
  | "return_to_bot"
  | "close"
  | "send_message"
  | null;

export function AnalystChatHeader({
  conversation,
  employeeIsOnline,
  isSearchOpen,
  messageQuery,
  searchContainerRef,
  currentAnalystId,
  isWorking,
  workingAction,
  onBack,
  onToggleSearch,
  onSearchQueryChange,
  onOpenTickets,
  onPerformAction,
  showAiThoughtProcess,
  onShowAiThoughtProcessChange,
}: {
  conversation: AnalystConversationListItem;
  employeeIsOnline: boolean;
  isSearchOpen: boolean;
  messageQuery: string;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  currentAnalystId: string;
  isWorking: boolean;
  workingAction: WorkingAction;
  onBack: () => void;
  onToggleSearch: () => void;
  onSearchQueryChange: (query: string) => void;
  onOpenTickets: () => void;
  onPerformAction: (action: "claim" | "return_to_bot" | "close") => void;
  showAiThoughtProcess: boolean;
  onShowAiThoughtProcessChange: (value: boolean) => void;
}) {
  const jobLabel = conversation.job?.trim() || null;
  const ticketCode = conversation.ticketCode;
  const footerUi = getAnalystFooterUi({
    status: conversation.status,
    assignedAnalystId: conversation.assignedAnalystId,
    currentAnalystId,
  });
  const showAssignedToolbar = footerUi.showAssignedToolbar;

  return (
    <div
      ref={searchContainerRef}
      className="relative z-30 shrink-0 border-b border-slate-200 bg-white"
    >
      <div className="flex h-[65px] items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Voltar para conversas"
            className="size-8 shrink-0 text-slate-500 sm:hidden"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <UserAvatar
            initials={conversation.initials}
            online={employeeIsOnline}
            pastelFromText={conversation.name}
            className="size-12 text-[14px]"
          />
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold text-slate-900">
              {conversation.name}
            </h2>
            <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px]">
              <span className={cn("font-medium", "text-zinc-500")}>
                {employeeIsOnline ? "Online" : "Offline"}
              </span>
              {jobLabel ? (
                <>
                  <span className="text-zinc-500" aria-hidden>
                    ·
                  </span>
                  <span className="truncate text-zinc-500">{jobLabel}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showAssignedToolbar ? (
            <>
              <AlertDialog>
                <AlertDialog.Trigger>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isWorking}
                    size="lg"
                    className="flex items-center gap-2 text-[11px] text-zinc-700"
                  >
                    <Bot className="size-3" />
                    <span className="font-semibold">
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
                      O Nexo Assist volta a atender esta conversa e você deixa
                      de controlar o chat.
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
                    variant="destructive"
                    disabled={isWorking}
                    className="flex items-center gap-2 text-[11px] text-red-600"
                  >
                    <CircleCheckBig className="size-3" />
                    <span className="font-semibold">
                      {workingAction === "close"
                        ? "Encerrando..."
                        : "Encerrar atendimento"}
                    </span>
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
                    <AlertDialog.Action
                      onClick={() => onPerformAction("close")}
                    >
                      Encerrar
                    </AlertDialog.Action>
                  </AlertDialog.Footer>
                </AlertDialog.Content>
              </AlertDialog>
            </>
          ) : (
            <>
              {/* {ticketCode ? (
                <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-600 sm:inline-flex">
                  {ticketCode}
                </span>
              ) : null} */}
              <ConversationStatusChip status={conversation.status} />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isSearchOpen ? "Fechar busca de mensagens" : "Buscar mensagens"
            }
            aria-pressed={isSearchOpen}
            onClick={onToggleSearch}
            className="text-slate-500"
          >
            {isSearchOpen ? (
              <X className="size-[18px]" />
            ) : (
              <Search className="size-[18px]" />
            )}
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Opções de visualização da conversa"
                  className="text-slate-500"
                />
              }
            >
              <MoreVertical className="size-[18px]" />
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-72 gap-3 p-3"
            >
              <PopoverHeader>
                <PopoverTitle className="text-sm text-slate-900">
                  Raciocínio da IA
                </PopoverTitle>
                <PopoverDescription className="text-[12px] leading-4 text-slate-500">
                  Mostra as ações, a confiança e o motivo do Nexo Assist acima
                  de cada resposta automática nesta conversa.
                </PopoverDescription>
              </PopoverHeader>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2">
                <Label
                  htmlFor="analyst-show-ai-reasoning"
                  className="cursor-pointer text-[12px] leading-4 font-medium text-slate-700"
                >
                  Exibir raciocínio nas mensagens
                </Label>
                <Switch
                  id="analyst-show-ai-reasoning"
                  checked={showAiThoughtProcess}
                  onCheckedChange={(checked) =>
                    onShowAiThoughtProcessChange(checked === true)
                  }
                  size="sm"
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ver chamados do colaborador"
            onClick={onOpenTickets}
            className="text-slate-500 xl:hidden"
          >
            <MoreHorizontal className="size-[18px]" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen ? (
          <motion.div
            key="message-search"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute inset-x-0 top-full z-40 border-b border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-sm sm:px-5"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={messageQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Buscar mensagens nesta conversa..."
                aria-label="Buscar mensagens nesta conversa"
                className="h-9 rounded-lg border-slate-200 pl-9 text-xs shadow-none focus-visible:border-brand-logo focus-visible:ring-brand-logo/20"
                autoFocus
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
