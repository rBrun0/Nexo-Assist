"use client";

import {
  ArrowLeftRight,
  Bot,
  CircleCheckBig,
  Headset,
  type LucideIcon,
} from "lucide-react";

import { formatMessageTime } from "@/lib/chat/format-message-time";
import {
  getChatEventDividerKind,
  type ChatEventDividerKind,
} from "@/lib/chat/event-divider-icon";

const EVENT_ICONS: Record<
  Exclude<ChatEventDividerKind, null>,
  LucideIcon
> = {
  transfer: ArrowLeftRight,
  claim: Headset,
  return_to_bot: Bot,
  closed: CircleCheckBig,
};

export function ChatEventDivider({
  label,
  createdAt,
}: {
  label: string;
  createdAt?: string;
}) {
  if (!label.trim()) return null;

  const kind = getChatEventDividerKind(label);
  const Icon = kind ? EVENT_ICONS[kind] : null;
  const time = createdAt ? formatMessageTime(createdAt) : null;

  return (
    <div className="flex items-center gap-3 py-2" role="separator">
      <div className="h-px min-w-0 flex-1 bg-slate-200" aria-hidden />
      <p className="flex shrink-0 items-center gap-1.5 text-center text-[12px] font-medium text-zinc-600">
        {Icon ? (
          <Icon className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
        ) : null}
        <span>{label}</span>
        {time ? (
          <span className="text-zinc-500 tabular-nums"> · {time}</span>
        ) : null}
      </p>
      <div className="h-px min-w-0 flex-1 bg-slate-200" aria-hidden />
    </div>
  );
}
