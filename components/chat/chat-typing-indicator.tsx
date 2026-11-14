"use client";

import { cn } from "@/lib/utils";

export function TypingDots({
  className,
  dotClassName,
}: {
  className?: string;
  dotClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1", className)} aria-hidden>
      <span
        className={cn(
          "size-1.5 animate-bounce rounded-full bg-success [animation-delay:-0.3s]",
          dotClassName,
        )}
      />
      <span
        className={cn(
          "size-1.5 animate-bounce rounded-full bg-success [animation-delay:-0.15s]",
          dotClassName,
        )}
      />
      <span
        className={cn(
          "size-1.5 animate-bounce rounded-full bg-success",
          dotClassName,
        )}
      />
    </span>
  );
}

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
        "inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-success/20 bg-white px-3 py-2 text-success shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <TypingDots />
      <span className="text-[11px] italic">{label}</span>
    </div>
  );
}
