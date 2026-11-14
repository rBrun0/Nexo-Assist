"use client";

import { ImpactChoiceCards } from "@/components/chat/impact-choice-cards";
import { formatAssistantRichText } from "@/lib/chat/format-assistant-rich-text";
import type { ChatOption } from "@/lib/validations/chat-metadata";

export function ImpactChoiceTurn({
  content,
  question,
  options,
  disabled = false,
  onSelect,
}: {
  content?: string;
  question: string;
  options: ChatOption[];
  /** Mantido na assinatura pelos turnos; horário não aparece no design do funcionário. */
  createdAt?: string;
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
    </div>
  );
}
