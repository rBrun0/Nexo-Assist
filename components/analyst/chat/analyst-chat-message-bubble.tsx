"use client";

import { CheckCheck } from "lucide-react";

import { ChatMessageFrame } from "@/components/chat/chat-message-frame";
import { Badge } from "@/components/ui/badge";
import type { AnalystChatMessage } from "@/lib/analyst/map-conversation";
import { cn } from "@/lib/utils";

export function AnalystChatMessageBubble({
  message,
  previousCreatedAt,
  currentAnalystId,
  currentAnalystName,
  showAiThoughtProcess = true,
}: {
  message: AnalystChatMessage;
  previousCreatedAt: string | null;
  currentAnalystId: string;
  currentAnalystName: string;
  showAiThoughtProcess?: boolean;
}) {
  const isSystem = message.author === "system";
  const isAnalyst = message.author === "analyst";
  const isAssistant = message.author === "assistant";
  const analystName =
    message.senderUser?.name ??
    (message.senderUserId === currentAnalystId
      ? currentAnalystName
      : "Analista");
  const analystJob = message.senderUser?.job?.trim() || null;
  const senderLabel = isAssistant ? (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="font-semibold text-zinc-700">Nexo Assist</span>
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[9px] font-semibold tracking-wide text-primary"
        aria-hidden
      >
        IA
      </span>
    </span>
  ) : isAnalyst ? (
    <span className="flex items-center justify-end gap-1.5">
      <span className="text-zinc-600">{analystName}</span>
      {analystJob ? (
        <Badge
          variant="ghost"
          pastelFromText={analystJob}
          className="h-4 border-0 px-1.5 text-[9px] font-medium"
        >
          {analystJob}
        </Badge>
      ) : null}
    </span>
  ) : null;
  const alignEnd = isAnalyst || isAssistant;

  return (
    <ChatMessageFrame
      createdAt={message.createdAt}
      previousCreatedAt={previousCreatedAt}
      isSystem={isSystem}
      systemLabel={message.text}
      senderLabel={senderLabel}
      senderLabelClassName={
        isAnalyst
          ? "mb-0 text-right text-[10px]"
          : "mb-0 text-[10px] text-slate-500"
      }
      thoughtProcess={
        isAssistant && showAiThoughtProcess ? message.thoughtProcess : undefined
      }
      messageId={isAssistant ? message.id : undefined}
      thoughtHeaderLayout={isAssistant ? "inline" : "stacked"}
      alignEnd={alignEnd}
    >
      <div
        className={cn(
          "relative rounded-lg border-none px-4 py-3 text-black shadow-sm",
          isAnalyst
            ? "rounded-br-sm bg-chat-analyst"
            : isAssistant
              ? "rounded-br-sm bg-primary/5"
              : "rounded-tl-sm border border-slate-200 bg-white",
        )}
      >
        <p className="text-[14.5px] leading-5">{message.text}</p>
        <p className="absolute right-3 bottom-1 flex items-center justify-end gap-1 text-[10px] text-zinc-500">
          {message.time}
          {isAnalyst ? (
            <CheckCheck
              className={cn(
                "size-3",
                message.readAtByEmployee ? "text-sky-500" : "text-slate-400",
              )}
              aria-label={
                message.readAtByEmployee
                  ? "Mensagem lida pelo colaborador"
                  : "Mensagem enviada"
              }
            />
          ) : null}
        </p>
      </div>
    </ChatMessageFrame>
  );
}
