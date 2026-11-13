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
  showAiThoughtProcess = true,
}: {
  conversation: AnalystConversationListItem;
  filteredMessages: AnalystChatMessage[];
  messageQuery: string;
  conversationError: string;
  currentAnalystId: string;
  currentAnalystName: string;
  showAiThoughtProcess?: boolean;
}) {
  return (
    <div className="chat-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 sm:px-12">
      {/* {conversation.handoffSummary ? (
        <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-5 text-amber-950">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p>
            <span className="font-semibold">Resumo do transbordo: </span>
            {conversation.handoffSummary}
          </p>
        </div>
      ) : null} */}
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
            showAiThoughtProcess={showAiThoughtProcess}
          />
        ))}
      </div>
    </div>
  );
}
