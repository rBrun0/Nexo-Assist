"use client";

import { Button } from "@/components/ui/button";
import type { ChatOption } from "@/lib/validations/chat-metadata";

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
          <Button
            key={`${option.label}-${index}`}
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className="h-auto justify-start rounded-xl px-3 py-3 text-left text-sm font-medium whitespace-normal"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
