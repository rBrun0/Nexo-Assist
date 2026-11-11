"use client";

import { useMemo, useState, type FormEvent } from "react";

import { AnalystChatEmptyState } from "@/components/analyst/chat/analyst-chat-empty-state";
import { AnalystChatFooter } from "@/components/analyst/chat/analyst-chat-footer";
import { AnalystChatHeader } from "@/components/analyst/chat/analyst-chat-header";
import { AnalystChatMessageList } from "@/components/analyst/chat/analyst-chat-message-list";
import { AnalystTicketsSheet } from "@/components/analyst/chat/analyst-tickets-sheet";
import { useConversationMessageSearch } from "@/hooks/use-conversation-message-search";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";
import { formatHandoffSince } from "@/lib/chat/format-handoff-since";
import { getFirstName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";

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
}) {
  const conversationId = conversation?.id ?? null;
  const messageSearch = useConversationMessageSearch(conversationId);
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
  const handoffSince = formatHandoffSince(conversation?.handoffAt ?? null);

  return (
    <section
      className={cn(
        "relative min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-subtle",
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
            onBack={onBack}
            onToggleSearch={messageSearch.toggleSearch}
            onSearchQueryChange={messageSearch.setQuery}
            onOpenTickets={() =>
              setTicketsSheetState({ conversationId, open: true })
            }
          />

          <AnalystChatMessageList
            conversation={conversation}
            filteredMessages={filteredMessages}
            messageQuery={messageSearch.messageQuery}
            conversationError={conversationError}
            currentAnalystId={currentAnalystId}
            currentAnalystName={currentAnalystName}
          />

          <AnalystChatFooter
            conversation={conversation}
            firstName={firstName}
            handoffSince={handoffSince}
            draft={draft}
            isWorking={isWorking}
            workingAction={workingAction}
            currentAnalystId={currentAnalystId}
            onDraftChange={onDraftChange}
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
