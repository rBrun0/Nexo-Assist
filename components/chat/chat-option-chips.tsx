"use client";

import type { ChatOption } from "@/lib/validations/chat-metadata";

export function ChatOptionChips({
  options,
  disabled = false,
  onSelect,
}: {
  options: ChatOption[];
  disabled?: boolean;
  onSelect: (option: ChatOption) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option, index) => (
        <button
          key={`${option.label}-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-medium text-brand-action hover:bg-blue-50 disabled:opacity-50"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
