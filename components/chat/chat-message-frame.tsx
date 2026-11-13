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
  thoughtHeaderLayout = "stacked",
  messageId,
  alignEnd,
  children,
}: {
  createdAt: string;
  previousCreatedAt: string | null;
  isSystem: boolean;
  systemLabel: string;
  senderLabel: ReactNode;
  senderLabelClassName?: string;
  thoughtProcess?: unknown;
  thoughtHeaderLayout?: "stacked" | "inline" | "label-start";
  messageId?: string;
  alignEnd: boolean;
  children: ReactNode;
}) {
  const dayKey = getChatDayKey(createdAt);
  const previousDayKey = previousCreatedAt
    ? getChatDayKey(previousCreatedAt)
    : null;
  const showDaySeparator = dayKey !== previousDayKey;
  const hasThought = thoughtProcess !== undefined;
  const inlineHeader = thoughtHeaderLayout === "inline";
  const labelStartHeader = thoughtHeaderLayout === "label-start";

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
            {inlineHeader ? (
              <div
                className={cn(
                  "relative mb-1 min-h-6 py-0.5",
                  senderLabel && "pr-[7.5rem]",
                )}
              >
                {hasThought ? (
                  <ThoughtProcessBlock
                    thoughtProcess={thoughtProcess}
                    messageId={messageId}
                    className="mb-0"
                  />
                ) : null}
                {senderLabel ? (
                  <p
                    className={cn(
                      "absolute top-0.5 right-0 z-[1] px-1 text-[11px] font-medium",
                      senderLabelClassName,
                    )}
                  >
                    {senderLabel}
                  </p>
                ) : null}
              </div>
            ) : labelStartHeader ? (
              <div className="mb-1 flex min-w-0 items-center gap-3 py-0.5">
                {senderLabel ? (
                  <p
                    className={cn(
                      "shrink-0 px-1 text-[11px] font-medium",
                      senderLabelClassName,
                    )}
                  >
                    {senderLabel}
                  </p>
                ) : null}
                {hasThought ? (
                  <ThoughtProcessBlock
                    thoughtProcess={thoughtProcess}
                    messageId={messageId}
                    className="mb-0 min-w-0 flex-1"
                  />
                ) : null}
              </div>
            ) : (
              <>
                {hasThought ? (
                  <ThoughtProcessBlock
                    thoughtProcess={thoughtProcess}
                    messageId={messageId}
                  />
                ) : null}
                {senderLabel ? (
                  <div
                    className={cn(
                      "flex items-center gap-1 py-0.5",
                      alignEnd && "justify-end",
                    )}
                  >
                    <p
                      className={cn(
                        "px-1 text-[11px] font-medium",
                        senderLabelClassName,
                      )}
                    >
                      {senderLabel}
                    </p>
                  </div>
                ) : null}
              </>
            )}
            {children}
          </div>
        </div>
      )}
    </motion.div>
  );
}
