"use client";

import { ShieldCheck } from "lucide-react";

import { AnalystChatMessageBubble } from "@/components/analyst/chat/analyst-chat-message-bubble";
import type {
  AnalystChatMessage,
  AnalystConversationListItem,
} from "@/lib/analyst/map-conversation";

export function AnalystChatMessageList({
  conversation,
  filteredMessages,
  messageQuery,
  conversationError,
  currentAnalystId,
  currentAnalystName,
}: {
  conversation: AnalystConversationListItem;
  filteredMessages: AnalystChatMessage[];
  messageQuery: string;
  conversationError: string;
  currentAnalystId: string;
  currentAnalystName: string;
}) {
  return (
    <div className="chat-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto mb-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500">
        <ShieldCheck className="size-3.5 text-brand-action" />
        Conversa vinculada ao atendimento Nexo
      </div>
      {conversation.handoffSummary ? (
        <div className="mx-auto mb-4 w-full max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <strong>Resumo do transbordo:</strong> {conversation.handoffSummary}
        </div>
      ) : null}
      {conversationError ? (
        <p
          role="alert"
          className="mx-auto mb-4 w-full max-w-3xl rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {conversationError}
        </p>
      ) : null}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {filteredMessages.length === 0 && messageQuery.trim() ? (
          <p className="py-10 text-center text-xs text-slate-500">
            Nenhuma mensagem encontrada para “{messageQuery.trim()}”.
          </p>
        ) : null}
        {filteredMessages.map((message, index) => (
          <AnalystChatMessageBubble
            key={message.id}
            message={message}
            previousCreatedAt={
              index > 0 ? filteredMessages[index - 1].createdAt : null
            }
            currentAnalystId={currentAnalystId}
            currentAnalystName={currentAnalystName}
          />
        ))}
      </div>
    </div>
  );
}
