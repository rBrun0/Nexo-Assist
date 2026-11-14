"use client";

import { Check, LoaderCircle } from "lucide-react";
import { Fragment } from "react";

import type { AgentActivityStep } from "@/lib/agent/activity";
import { cn } from "@/lib/utils";

export function AgentActivityTrail({
  steps,
  className,
  stacked = false,
}: {
  steps: AgentActivityStep[];
  className?: string;
  /** Lista vertical completa (popover); padrão é faixa horizontal truncada. */
  stacked?: boolean;
}) {
  if (steps.length === 0) return null;

  if (stacked) {
    return (
      <ul
        className={cn("flex flex-col gap-1.5", className)}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {steps.map((step) => {
          const isRunning = step.status === "running";
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-start gap-1.5 text-[12px] leading-4 text-slate-600",
                isRunning && "text-slate-500",
              )}
            >
              {isRunning ? (
                <LoaderCircle className="mt-0.5 size-3 shrink-0 animate-spin text-brand-action/70" />
              ) : (
                <Check className="mt-0.5 size-3 shrink-0 text-zinc-500" />
              )}
              <span className={cn(isRunning && "animate-pulse")}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul
      className={cn(
        "flex min-w-0 flex-nowrap items-center gap-x-1.5 overflow-hidden px-1",
        className,
      )}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {steps.map((step, index) => {
        const isRunning = step.status === "running";
        return (
          <Fragment key={step.id}>
            {index > 0 ? (
              <li
                aria-hidden
                className="shrink-0 text-[11px] leading-4 text-slate-300"
              >
                ·
              </li>
            ) : null}
            <li
              className={cn(
                "flex min-w-0 max-w-full shrink items-center gap-1 text-[11px] leading-4 text-slate-500",
                isRunning && "text-slate-500",
              )}
            >
              {isRunning ? (
                <LoaderCircle className="size-3 shrink-0 animate-spin text-brand-action/70" />
              ) : (
                <Check className="size-3 shrink-0 text-zinc-500" />
              )}
              <span
                className={cn(
                  "min-w-0 truncate",
                  isRunning && "animate-pulse",
                )}
              >
                {step.label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
