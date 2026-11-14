"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";

import { AnalystChatEmptyState } from "@/components/analyst/chat/analyst-chat-empty-state";
import { AnalystChatFooter } from "@/components/analyst/chat/analyst-chat-footer";
import { AnalystChatHeader } from "@/components/analyst/chat/analyst-chat-header";
import { AnalystChatMessageList } from "@/components/analyst/chat/analyst-chat-message-list";
import { AnalystTicketsSheet } from "@/components/analyst/chat/analyst-tickets-sheet";
import { useConversationMessageSearch } from "@/hooks/use-conversation-message-search";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { formatHandoffUntil } from "@/lib/chat/format-handoff-until";
import { getFirstName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";

const AI_THOUGHT_PROCESS_STORAGE_KEY = "nexo-analyst-show-ai-reasoning";
const AI_THOUGHT_PROCESS_EVENT = "nexo-analyst-show-ai-reasoning-change";

function readShowAiThoughtProcessPreference() {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(AI_THOUGHT_PROCESS_STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

function subscribeShowAiThoughtProcess(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AI_THOUGHT_PROCESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AI_THOUGHT_PROCESS_EVENT, onStoreChange);
  };
}

function writeShowAiThoughtProcessPreference(value: boolean) {
  window.localStorage.setItem(
    AI_THOUGHT_PROCESS_STORAGE_KEY,
    value ? "true" : "false",
  );
  window.dispatchEvent(new Event(AI_THOUGHT_PROCESS_EVENT));
}

type WorkingAction =
  | "claim"
  | "return_to_bot"
  | "close"
  | "send_message"
  | null;

export function AnalystChatPanel({
  conversation,
  currentAnalystId,
  currentAnalystName,
  waitingCount,
  employeeIsOnline,
  conversationError,
  draft,
  isWorking,
  workingAction,
  onDraftChange,
  onBack,
  onPerformAction,
  onSendMessage,
  onTicketStatusChange,
  peerIsTyping = false,
  onTypingActivity,
  onUnseenCountChange,
}: {
  conversation: AnalystConversationListItem | null;
  currentAnalystId: string;
  waitingCount: number;
  currentAnalystName: string;
  now: number;
  employeeIsOnline: boolean;
  conversationError: string;
  draft: string;
  isWorking: boolean;
  workingAction: WorkingAction;
  onDraftChange: (value: string) => void;
  onBack: () => void;
  onPerformAction: (action: "claim" | "return_to_bot" | "close") => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  onTicketStatusChange?: (ticketId: string, status: string) => Promise<void>;
  peerIsTyping?: boolean;
  onTypingActivity?: () => void;
  onUnseenCountChange?: (count: number) => void;
}) {
  const conversationId = conversation?.id ?? null;
  const messageSearch = useConversationMessageSearch(conversationId);
  const showAiThoughtProcess = useSyncExternalStore(
    subscribeShowAiThoughtProcess,
    readShowAiThoughtProcessPreference,
    () => true,
  );
  const [ticketsSheetState, setTicketsSheetState] = useState({
    conversationId,
    open: false,
  });
  if (ticketsSheetState.conversationId !== conversationId) {
    setTicketsSheetState({ conversationId, open: false });
  }

  const filteredMessages = useMemo(() => {
    if (!conversation) return [];
    const query = messageSearch.messageQuery.trim().toLocaleLowerCase("pt-BR");
    if (!query) return conversation.messages;
    return conversation.messages.filter((message) =>
      message.text.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [conversation, messageSearch.messageQuery]);

  const firstName = conversation
    ? getFirstName(conversation.name)
    : "Colaborador";
  const handoffUntil = formatHandoffUntil(conversation?.handoffAt ?? null);

  return (
    <section
      className={cn(
        "relative min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface",
        conversation ? "flex" : "hidden sm:flex",
      )}
      aria-label={
        conversation
          ? `Conversa com ${conversation.name}`
          : "Nenhuma conversa selecionada"
      }
    >
      {conversation && conversationId ? (
        <>
          <AnalystChatHeader
            conversation={conversation}
            employeeIsOnline={employeeIsOnline}
            isSearchOpen={messageSearch.isSearchOpen}
            messageQuery={messageSearch.messageQuery}
            searchContainerRef={messageSearch.searchContainerRef}
            currentAnalystId={currentAnalystId}
            isWorking={isWorking}
            workingAction={workingAction}
            onBack={onBack}
            onToggleSearch={messageSearch.toggleSearch}
            onSearchQueryChange={messageSearch.setQuery}
            onOpenTickets={() =>
              setTicketsSheetState({ conversationId, open: true })
            }
            onPerformAction={onPerformAction}
            showAiThoughtProcess={showAiThoughtProcess}
            onShowAiThoughtProcessChange={writeShowAiThoughtProcessPreference}
          />

          <AnalystChatMessageList
            conversation={conversation}
            filteredMessages={filteredMessages}
            messageQuery={messageSearch.messageQuery}
            conversationError={conversationError}
            currentAnalystId={currentAnalystId}
            currentAnalystName={currentAnalystName}
            showAiThoughtProcess={showAiThoughtProcess}
            peerIsTyping={peerIsTyping}
            onUnseenCountChange={onUnseenCountChange}
          />

          <AnalystChatFooter
            conversation={conversation}
            firstName={firstName}
            handoffUntil={handoffUntil}
            draft={draft}
            isWorking={isWorking}
            workingAction={workingAction}
            currentAnalystId={currentAnalystId}
            onDraftChange={onDraftChange}
            onTypingActivity={onTypingActivity}
            onPerformAction={onPerformAction}
            onSendMessage={onSendMessage}
          />

          <AnalystTicketsSheet
            open={ticketsSheetState.open}
            onOpenChange={(open) =>
              setTicketsSheetState({ conversationId, open })
            }
            conversation={conversation}
            currentAnalystId={currentAnalystId}
            onTicketStatusChange={onTicketStatusChange}
          />
        </>
      ) : (
        <AnalystChatEmptyState waitingCount={waitingCount} />
      )}
    </section>
  );
}
