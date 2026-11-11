"use client";

import type { ReactNode } from "react";

import { formatMessageTime } from "@/lib/chat/format-message-time";

export function AssistantTextBubble({
  content,
  createdAt,
  footer,
}: {
  content: string;
  createdAt: string;
  footer?: ReactNode;
}) {
  if (!content.trim() && !footer) return null;

  return (
    <div className="relative rounded-lg rounded-tl-md border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">
      {content.trim() ? (
        <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
      ) : null}
      {footer}
      <p className="absolute mt-1 text-right text-[10px] text-slate-400 right-3 bottom-0">
        {formatMessageTime(createdAt)}
      </p>
    </div>
  );
}
