"use client";

import type { ReactNode } from "react";

import { formatAssistantRichText } from "@/lib/chat/format-assistant-rich-text";

export function AssistantTextBubble({
  content,
  footer,
}: {
  content: string;
  /** Mantido na assinatura: turnos ainda passam createdAt; horário não aparece no design do funcionário. */
  createdAt?: string;
  footer?: ReactNode;
}) {
  if (!content.trim() && !footer) return null;

  return (
    <div className="w-fit max-w-full rounded-xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-slate-700">
      {content.trim() ? formatAssistantRichText(content) : null}
      {footer}
    </div>
  );
}
