"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import {
  ChatDaySeparator,
  formatChatDayLabel,
  getChatDayKey,
} from "@/components/chat/chat-day-separator";
import { ChatEventDivider } from "@/components/chat/chat-event-divider";
import { ThoughtProcessBlock } from "@/components/chat/thought-process-block";
import { cn } from "@/lib/utils";

export function ChatMessageFrame({
  createdAt,
  previousCreatedAt,
  isSystem,
  systemLabel,
  senderLabel,
  senderLabelClassName,
  thoughtProcess,
  alignEnd,
  children,
}: {
  createdAt: string;
  previousCreatedAt: string | null;
  isSystem: boolean;
  systemLabel: string;
  senderLabel: string | null;
  senderLabelClassName?: string;
  thoughtProcess?: unknown;
  alignEnd: boolean;
  children: ReactNode;
}) {
  const dayKey = getChatDayKey(createdAt);
  const previousDayKey = previousCreatedAt
    ? getChatDayKey(previousCreatedAt)
    : null;
  const showDaySeparator = dayKey !== previousDayKey;

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {showDaySeparator ? (
        <ChatDaySeparator label={formatChatDayLabel(createdAt)} />
      ) : null}
      {isSystem ? (
        <ChatEventDivider label={systemLabel} createdAt={createdAt} />
      ) : (
        <div className={cn("flex", alignEnd ? "justify-end" : "justify-start")}>
          <div className="min-w-0 w-full max-w-[min(92%,720px)]">
            <div
              className={cn(
                "flex items-center gap-1 py-0.5",
                alignEnd && "justify-end",
              )}
            >
              {senderLabel ? (
                <p
                  className={cn(
                    "mb-1 px-1 text-[11px] font-medium",
                    senderLabelClassName,
                  )}
                >
                  {senderLabel}
                </p>
              ) : null}
              {thoughtProcess !== undefined ? (
                <ThoughtProcessBlock thoughtProcess={thoughtProcess} />
              ) : null}
            </div>
            {children}
          </div>
        </div>
      )}
    </motion.div>
  );
}
