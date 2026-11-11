"use client";

import { cn } from "@/lib/utils";

export function ChatTypingIndicator({
  label = "digitando...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3 py-2 text-slate-500 shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1" aria-hidden>
        <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
      </span>
      <span className="text-[11px] italic">{label}</span>
    </div>
  );
}
