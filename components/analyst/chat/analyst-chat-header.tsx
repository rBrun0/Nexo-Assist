"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, MoreHorizontal, Search, X } from "lucide-react";

import { ConversationStatusChip } from "@/components/analyst/chat/conversation-status-chip";
import { UserAvatar } from "@/components/chat/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { cn } from "@/lib/utils";

export function AnalystChatHeader({
  conversation,
  employeeIsOnline,
  isSearchOpen,
  messageQuery,
  searchContainerRef,
  onBack,
  onToggleSearch,
  onSearchQueryChange,
  onOpenTickets,
}: {
  conversation: AnalystConversationListItem;
  employeeIsOnline: boolean;
  isSearchOpen: boolean;
  messageQuery: string;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onToggleSearch: () => void;
  onSearchQueryChange: (query: string) => void;
  onOpenTickets: () => void;
}) {
  const jobLabel = conversation.job?.trim() || null;
  const ticketCode = conversation.ticketCode;

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
          />
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold text-slate-900">
              {conversation.name}
            </h2>
            <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px]">
              <span
                className={cn(
                  "font-medium",
                  employeeIsOnline ? "text-emerald-600" : "text-slate-400",
                )}
              >
                {employeeIsOnline ? "Online" : "Offline"}
              </span>
              {jobLabel ? (
                <>
                  <span className="text-slate-300" aria-hidden>
                    ·
                  </span>
                  <span className="truncate text-slate-500">{jobLabel}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ticketCode ? (
            <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-600 sm:inline-flex">
              {ticketCode}
            </span>
          ) : null}
          <ConversationStatusChip status={conversation.status} />
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
