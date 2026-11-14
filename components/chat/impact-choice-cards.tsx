"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{question}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option, index) => {
          const isSelected = selectedLabel === option.label;
          return (
            <Button
              key={`${option.label}-${index}`}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                setSelectedLabel(option.label);
                onSelect(option);
              }}
              className={cn(
                "h-auto justify-start rounded-xl px-3 py-3 text-left text-sm font-medium whitespace-normal transition-colors",
                isSelected
                  ? "border-brand-action bg-brand-logo-soft text-brand-action hover:bg-brand-logo-soft hover:text-brand-action"
                  : "border-slate-200 bg-white text-slate-800 hover:border-brand-action/40 hover:bg-brand-logo-soft/60 hover:text-brand-action",
              )}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
