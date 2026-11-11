"use client";

import { MoreHorizontal, Search } from "lucide-react";

import { ConversationQueue } from "@/components/analyst/conversation-queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ConversationFilter,
} from "@/lib/analyst/conversation-filters";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { cn, plural } from "@/lib/utils";

export type { ConversationFilter };

const FILTERS: Array<{ id: ConversationFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "for_you", label: "Para você" },
  { id: "agent", label: "Com o agente" },
  { id: "mine", label: "Minhas" },
];

export function AnalystQueuePanel({
  conversations,
  filteredConversations,
  selectedId,
  currentAnalystId,
  now,
  search,
  conversationFilter,
  hasSelectedConversation,
  employeeIsOnline,
  onSearchChange,
  onFilterChange,
  onSelect,
}: {
  conversations: AnalystConversationListItem[];
  filteredConversations: AnalystConversationListItem[];
  selectedId: string | null;
  currentAnalystId: string;
  now: number;
  search: string;
  conversationFilter: ConversationFilter;
  hasSelectedConversation: boolean;
  employeeIsOnline: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: ConversationFilter) => void;
  onSelect: (conversationId: string) => void;
}) {
  return (
    <aside
      className={cn(
        "w-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white sm:flex sm:w-[330px]",
        hasSelectedConversation ? "hidden" : "flex",
      )}
      aria-label="Lista de conversas"
    >
      <div className="border-b border-slate-100 px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Conversas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {conversations.length}{" "}
              {plural(
                conversations.length,
                "conversa recente",
                "conversas recentes",
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mais opções de conversas"
            className="text-slate-500"
          >
            <MoreHorizontal className="size-[18px]" />
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar conversa..."
            aria-label="Buscar conversa"
            className="h-9 rounded-lg border-slate-200 pl-9 text-xs shadow-none placeholder:text-slate-400 focus-visible:border-brand-logo focus-visible:ring-brand-logo/20"
          />
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {FILTERS.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              aria-pressed={conversationFilter === filter.id}
              onClick={() => onFilterChange(filter.id)}
              variant={conversationFilter === filter.id ? "default" : "ghost"}
              className={cn(
                "h-7 shrink-0 rounded-full px-2.5 text-[11px]",
                conversationFilter === filter.id
                  ? "bg-brand-action text-white hover:bg-brand-action-hover"
                  : "text-slate-500",
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="analyst-conversation-list min-h-0 flex-1 overflow-y-auto">
        <ConversationQueue
          conversations={filteredConversations}
          selectedId={selectedId}
          currentAnalystId={currentAnalystId}
          now={now}
          employeeIsOnline={employeeIsOnline}
          onSelect={onSelect}
        />
      </div>
    </aside>
  );
}
