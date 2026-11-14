"use client";

import { Search } from "lucide-react";

import { UserAvatar } from "@/components/chat/user-avatar";
import { getConversationStatusDetail } from "@/lib/analyst/conversation-status";
import { formatQueuePreview } from "@/lib/analyst/queue-preview";
import {
  getConversationStatusTone,
  getConversationStatusToneClasses,
  type AnalystConversationListItem,
} from "@/lib/analyst/map-conversation";
import { formatQueueTime } from "@/lib/chat/format-queue-time";
import { cn } from "@/lib/utils";

export function ConversationQueue({
  conversations,
  selectedId,
  currentAnalystId,
  now,
  employeeIsOnline,
  typingBySessionId = {},
  onSelect,
}: {
  conversations: AnalystConversationListItem[];
  selectedId: string | null;
  currentAnalystId: string;
  now: number;
  employeeIsOnline: boolean;
  typingBySessionId?: Record<string, boolean>;
  onSelect: (conversationId: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <Search className="mx-auto size-5 text-slate-300" />
        <p className="mt-3 text-xs font-medium text-slate-600">
          Nenhuma conversa encontrada
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tente buscar por outro nome.
        </p>
      </div>
    );
  }

  return (
    <>
      {conversations.map((conversation) => {
        const preview = formatQueuePreview(conversation, currentAnalystId);
        const tone = getConversationStatusToneClasses(
          getConversationStatusTone(conversation.status),
        );
        const statusDetail = getConversationStatusDetail(
          conversation,
          currentAnalystId,
          now,
        );
        const queueTime = conversation.lastMessageAt
          ? formatQueueTime(conversation.lastMessageAt, now)
          : conversation.time;

        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            aria-current={selectedId === conversation.id ? "true" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg gap-2 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50",
              selectedId === conversation.id && "bg-zinc-100",
            )}
          >
            <UserAvatar
              initials={conversation.initials}
              online={selectedId === conversation.id && employeeIsOnline}
              pastelFromText={conversation.name}
              className="size-12 text-[14px]"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-semibold text-slate-800">
                  {conversation.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-medium text-zinc-500",
                    {
                      "text-[12px] font-semibold text-brand-action":
                        conversation.unread,
                    },
                  )}
                >
                  {queueTime}
                </span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[11px] text-slate-500",
                    typingBySessionId[conversation.id] &&
                      "italic text-success",
                  )}
                >
                  {typingBySessionId[conversation.id]
                    ? "digitando..."
                    : preview}
                </span>
                {conversation.unread > 0 && (
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-action text-[10px] font-semibold text-white">
                    {conversation.unread}
                  </span>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-1">
                <div className="flex items-center">
                  <span className={cn(tone.dot, "size-1.5 rounded-full")} />
                  <span
                    className={cn(
                      "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      tone.text,
                    )}
                  >
                    {statusDetail}
                  </span>
                </div>
                {conversation.ticketCode ? (
                  <span
                    className={cn(
                      "inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium",
                      tone.text,
                    )}
                  >
                    {conversation.ticketCode}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        );
      })}
    </>
  );
}
