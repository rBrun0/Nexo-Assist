"use client";

import { Check, LoaderCircle } from "lucide-react";

import type { AgentActivityStep } from "@/lib/agent/activity";
import { cn } from "@/lib/utils";

export function AgentActivityTrail({
  steps,
  className,
}: {
  steps: AgentActivityStep[];
  className?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <ul
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 px-1",
        className,
      )}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {steps.map((step) => {
        const isRunning = step.status === "running";
        return (
          <li
            key={step.id}
            className={cn(
              "flex max-w-full items-center gap-1 text-[11px] leading-4 text-slate-500",
              isRunning && "text-slate-500",
            )}
          >
            {isRunning ? (
              <LoaderCircle className="size-3 shrink-0 animate-spin text-brand-action/70" />
            ) : (
              <Check className="size-3 shrink-0 text-zinc-500" />
            )}
            <span className={cn("min-w-0 break-words", isRunning && "animate-pulse")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
