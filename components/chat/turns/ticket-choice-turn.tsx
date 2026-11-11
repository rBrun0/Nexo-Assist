"use client";

import { AssistantTextBubble } from "@/components/chat/assistant-text-bubble";
import { TicketChoiceList } from "@/components/chat/ticket-choice-list";
import type {
  TicketChoiceIntent,
  TicketChoiceItem,
} from "@/lib/validations/chat-metadata";

export function TicketChoiceTurn({
  content,
  createdAt,
  tickets,
  intent,
  disabled = false,
  onSelect,
}: {
  content: string;
  createdAt: string;
  tickets: TicketChoiceItem[];
  intent: TicketChoiceIntent;
  disabled?: boolean;
  onSelect: (ticket: TicketChoiceItem, intent: TicketChoiceIntent) => void;
}) {
  return (
    <div className="space-y-3">
      <AssistantTextBubble content={content} createdAt={createdAt} />
      <TicketChoiceList
        tickets={tickets}
        intent={intent}
        disabled={disabled}
        onSelect={onSelect}
      />
    </div>
  );
}
