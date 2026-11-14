"use client";

import { useEffect, useRef } from "react";

import { AnalystChatMessageBubble } from "@/components/analyst/chat/analyst-chat-message-bubble";
import { ChatScrollToBottom } from "@/components/chat/chat-scroll-to-bottom";
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator";
import { useChatScrollFab } from "@/hooks/use-chat-scroll-fab";
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
  peerIsTyping = false,
  onUnseenCountChange,
}: {
  conversation: AnalystConversationListItem;
  filteredMessages: AnalystChatMessage[];
  messageQuery: string;
  conversationError: string;
  currentAnalystId: string;
  currentAnalystName: string;
  showAiThoughtProcess?: boolean;
  peerIsTyping?: boolean;
  onUnseenCountChange?: (count: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { showFab, newCount, scrollToBottom } = useChatScrollFab({
    scrollRef,
    endRef: messagesEndRef,
    messageCount: filteredMessages.length,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.id]);

  useEffect(() => {
    onUnseenCountChange?.(showFab ? newCount : 0);
  }, [newCount, onUnseenCountChange, showFab]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="chat-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 sm:px-12"
      >
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
          {peerIsTyping ? (
            <div className="flex justify-start">
              <ChatTypingIndicator label="digitando..." />
            </div>
          ) : null}
          <div ref={messagesEndRef} className="h-px w-full shrink-0" />
        </div>
      </div>
      <ChatScrollToBottom
        visible={showFab}
        newCount={newCount}
        typing={peerIsTyping}
        onClick={scrollToBottom}
        className="bottom-5 right-6"
      />
    </div>
  );
}
