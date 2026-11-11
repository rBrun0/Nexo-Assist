"use client";

import { CheckCheck } from "lucide-react";

import { ChatMessageFrame } from "@/components/chat/chat-message-frame";
import type { AnalystChatMessage } from "@/lib/analyst/map-conversation";
import { cn } from "@/lib/utils";

export function AnalystChatMessageBubble({
  message,
  previousCreatedAt,
  currentAnalystId,
  currentAnalystName,
}: {
  message: AnalystChatMessage;
  previousCreatedAt: string | null;
  currentAnalystId: string;
  currentAnalystName: string;
}) {
  const isSystem = message.author === "system";
  const isAnalyst = message.author === "analyst";
  const senderLabel =
    message.author === "assistant"
      ? "Nexo Assist"
      : message.author === "analyst"
        ? (message.senderUser?.name ??
          (message.senderUserId === currentAnalystId
            ? currentAnalystName
            : "Analista"))
        : null;
  const alignEnd = isAnalyst || senderLabel === "Nexo Assist";

  return (
    <ChatMessageFrame
      createdAt={message.createdAt}
      previousCreatedAt={previousCreatedAt}
      isSystem={isSystem}
      systemLabel={message.text}
      senderLabel={senderLabel}
      senderLabelClassName={
        isAnalyst
          ? "text-right text-[10px] text-slate-400"
          : "text-[10px] text-slate-500"
      }
      thoughtProcess={
        message.author === "assistant" ? message.thoughtProcess : undefined
      }
      alignEnd={alignEnd}
    >
      <div
        className={cn(
          "relative rounded-lg px-4 py-2 shadow-sm",
          alignEnd
            ? "rounded-br-xs bg-primary/5 text-black"
            : "rounded-tl-xs border border-slate-200 bg-white text-slate-700",
        )}
      >
        <p className="text-[12px] leading-5">{message.text}</p>
        <p className="absolute right-3 bottom-0 flex items-center justify-end gap-1 text-[9px] text-slate-400">
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
