"use client";

import { ImpactChoiceCards } from "@/components/chat/impact-choice-cards";
import { formatAssistantRichText } from "@/lib/chat/format-assistant-rich-text";
import { formatMessageTime } from "@/lib/chat/format-message-time";
import type { ChatOption } from "@/lib/validations/chat-metadata";

export function ImpactChoiceTurn({
  content,
  question,
  options,
  createdAt,
  disabled = false,
  onSelect,
}: {
  content?: string;
  question: string;
  options: ChatOption[];
  createdAt: string;
  disabled?: boolean;
  onSelect: (option: ChatOption) => void;
}) {
  const trimmed = content?.trim() ?? "";

  return (
    <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm">
      {trimmed ? (
        <div className="mb-3 text-slate-700">{formatAssistantRichText(trimmed)}</div>
      ) : null}
      <ImpactChoiceCards
        question={question}
        options={options}
        disabled={disabled}
        onSelect={onSelect}
      />
      <p className="mt-2 text-right text-[10px] text-slate-400">
        {formatMessageTime(createdAt)}
      </p>
    </div>
  );
}
