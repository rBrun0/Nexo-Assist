"use client";

import { AssistantTextBubble } from "@/components/chat/assistant-text-bubble";
import { ChatOptionChips } from "@/components/chat/chat-option-chips";
import { TicketStatusCard } from "@/components/chat/ticket-status-card";
import type {
  ChatOption,
  TicketChoiceItem,
} from "@/lib/validations/chat-metadata";

export function TicketStatusTurn({
  content,
  createdAt,
  ticket,
  options = [],
  disabled = false,
  onOptionSelect,
}: {
  content: string;
  createdAt: string;
  ticket: TicketChoiceItem & {
    description?: string;
    isOverdue?: boolean;
    slaDeadline?: string | null;
  };
  options?: ChatOption[];
  disabled?: boolean;
  onOptionSelect: (option: ChatOption) => void;
}) {
  return (
    <div className="space-y-3">
      <TicketStatusCard ticket={ticket} />
      <AssistantTextBubble
        content={content}
        createdAt={createdAt}
        footer={
          <ChatOptionChips
            options={options}
            disabled={disabled}
            onSelect={onOptionSelect}
          />
        }
      />
    </div>
  );
}
