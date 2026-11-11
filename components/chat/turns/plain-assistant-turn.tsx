"use client";

import { AssistantTextBubble } from "@/components/chat/assistant-text-bubble";
import { ChatOptionChips } from "@/components/chat/chat-option-chips";
import type { ChatOption } from "@/lib/validations/chat-metadata";

export function PlainAssistantTurn({
  content,
  createdAt,
  options = [],
  disabled = false,
  onOptionSelect,
}: {
  content: string;
  createdAt: string;
  options?: ChatOption[];
  disabled?: boolean;
  onOptionSelect: (option: ChatOption) => void;
}) {
  return (
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
  );
}
