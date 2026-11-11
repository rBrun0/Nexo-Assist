"use client";

import { formatMessageTime } from "@/lib/chat/format-message-time";

export function ChatEventDivider({
  label,
  createdAt,
}: {
  label: string;
  createdAt?: string;
}) {
  if (!label.trim()) return null;

  const time = createdAt ? formatMessageTime(createdAt) : null;

  return (
    <div className="flex items-center gap-3 py-2" role="separator">
      <div className="h-px min-w-0 flex-1 bg-slate-200" aria-hidden />
      <p className="shrink-0 text-center text-[10px] font-medium text-slate-500">
        <span>{label}</span>
        {time ? (
          <span className="text-slate-400 tabular-nums"> · {time}</span>
        ) : null}
      </p>
      <div className="h-px min-w-0 flex-1 bg-slate-200" aria-hidden />
    </div>
  );
}
