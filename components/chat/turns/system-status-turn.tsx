"use client";

import { AssistantTextBubble } from "@/components/chat/assistant-text-bubble";
import { ChatOptionChips } from "@/components/chat/chat-option-chips";
import { SystemStatusCard } from "@/components/chat/system-status-card";
import type { ChatOption } from "@/lib/validations/chat-metadata";

export function SystemStatusTurn({
  content,
  createdAt,
  source,
  message,
  services,
  options = [],
  disabled = false,
  onOptionSelect,
}: {
  content: string;
  createdAt: string;
  source: string;
  message: string;
  services: Array<{ id: string; name: string; status: string }>;
  options?: ChatOption[];
  disabled?: boolean;
  onOptionSelect: (option: ChatOption) => void;
}) {
  return (
    <div className="space-y-3">
      <AssistantTextBubble content={content} createdAt={createdAt} />
      <SystemStatusCard
        source={source}
        message={message}
        services={services}
      />
      <ChatOptionChips
        options={options}
        disabled={disabled}
        onSelect={onOptionSelect}
      />
    </div>
  );
}
