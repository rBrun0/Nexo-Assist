"use client";

import type { ChatOption } from "@/lib/validations/chat-metadata";
import { cn } from "@/lib/utils";

export function ImpactChoiceCards({
  question = "Quem está sendo afetado?",
  options,
  disabled = false,
  onSelect,
}: {
  question?: string;
  options: ChatOption[];
  disabled?: boolean;
  onSelect: (option: ChatOption) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{question}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={cn(
              "rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-800 transition-colors",
              "hover:border-blue-200 hover:bg-blue-50/60",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
