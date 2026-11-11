"use client";

import { Bot } from "lucide-react";

import {
  getConversationStatusLabel,
  getConversationStatusTone,
  getConversationStatusToneClasses,
  type AnalystConversationListItem,
} from "@/lib/analyst/map-conversation";
import { cn } from "@/lib/utils";

export function ConversationStatusChip({
  status,
}: {
  status: AnalystConversationListItem["status"];
}) {
  const tone = getConversationStatusToneClasses(
    getConversationStatusTone(status),
  );

  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 font-medium",
        tone.chip,
      )}
    >
      <Bot className="size-3.5" />
      <span className="text-[10px]">{getConversationStatusLabel(status)}</span>
    </span>
  );
}
