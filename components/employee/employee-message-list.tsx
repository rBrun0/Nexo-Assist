"use client";

import type { RefObject } from "react";
import { motion } from "motion/react";

import { AgentActivityTrail } from "@/components/chat/agent-activity-trail";
import { AssistantMessageBlocks } from "@/components/chat/assistant-message-blocks";
import { ChatMessageFrame } from "@/components/chat/chat-message-frame";
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator";
import type { AgentActivityStep } from "@/lib/agent/activity";
import { formatMessageTime } from "@/lib/chat/format-message-time";
import type { ChatHistoryMessage } from "@/lib/types/conversation";
import type {
  ChatOption,
  TicketChoiceIntent,
  TicketChoiceItem,
} from "@/lib/validations/chat-metadata";

export function EmployeeMessageList({
  messages,
  isSendingMessage,
  agentActivitySteps,
  streamedResponseText,
  lastInteractiveAssistantMessageId,
  messagesEndRef,
  onOptionSelect,
  onTicketSelect,
  onArticleSelect,
  onConfirmDraft,
  onEditDraft,
  onCancelDraft,
}: {
  messages: ChatHistoryMessage[];
  isSendingMessage: boolean;
  agentActivitySteps: AgentActivityStep[];
  streamedResponseText: string;
  lastInteractiveAssistantMessageId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onOptionSelect: (option: ChatOption) => void;
  onTicketSelect: (
    ticket: TicketChoiceItem,
    intent: TicketChoiceIntent,
  ) => void;
  onArticleSelect: (article: { title: string; category?: string }) => void;
  onConfirmDraft: (draftMessageId: string) => void;
  onEditDraft: () => void;
  onCancelDraft: (draftMessageId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 py-2">
      {messages.map((chatMessage, index) => {
        const isSystemMessage = chatMessage.sender === "SYSTEM";
        const isEmployeeMessage = chatMessage.sender === "EMPLOYEE";
        const isAssistantMessage = chatMessage.sender === "ASSISTANT";
        const isInteractiveAssistantMessage =
          isAssistantMessage &&
          chatMessage.id === lastInteractiveAssistantMessageId &&
          !isSendingMessage;
        const senderLabel = isAssistantMessage
          ? "Nexo Assist"
          : chatMessage.sender === "ANALYST"
            ? (chatMessage.senderUser?.name ?? "Analista")
            : null;

        return (
          <ChatMessageFrame
            key={chatMessage.id}
            createdAt={chatMessage.createdAt}
            previousCreatedAt={
              index > 0 ? messages[index - 1].createdAt : null
            }
            isSystem={isSystemMessage}
            systemLabel={chatMessage.content}
            senderLabel={senderLabel}
            thoughtProcess={
              isAssistantMessage ? chatMessage.thoughtProcess : undefined
            }
            alignEnd={isEmployeeMessage}
          >
            {isAssistantMessage ? (
              <AssistantMessageBlocks
                content={chatMessage.content}
                createdAt={chatMessage.createdAt}
                metadata={chatMessage.metadata}
                interactive={isInteractiveAssistantMessage}
                disabled={isSendingMessage}
                onOptionSelect={onOptionSelect}
                onTicketSelect={onTicketSelect}
                onArticleSelect={onArticleSelect}
                onConfirmDraft={() => onConfirmDraft(chatMessage.id)}
                onEditDraft={onEditDraft}
                onCancelDraft={() => onCancelDraft(chatMessage.id)}
              />
            ) : (
              <div
                className={`relative rounded-xl px-4 py-2.5 shadow-sm ${
                  isEmployeeMessage
                    ? "rounded-br-sm bg-chat-user text-white"
                    : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {chatMessage.content}
                </p>
                <p
                  className={`absolute mt-1 text-right text-[10px] right-3 bottom-0 ${
                    isEmployeeMessage ? "text-white/60" : "text-slate-400"
                  }`}
                >
                  {formatMessageTime(chatMessage.createdAt)}
                </p>
              </div>
            )}
          </ChatMessageFrame>
        );
      })}
      {isSendingMessage ? (
        <motion.div
          className="flex justify-start"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="min-w-0 w-full max-w-[min(92%,720px)]">
            <AgentActivityTrail steps={agentActivitySteps} />
            <p className="mb-1 px-1 text-[11px] font-medium text-slate-500">
              Nexo Assist
            </p>
            {streamedResponseText ? (
              <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm">
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {streamedResponseText}
                </p>
              </div>
            ) : (
              <ChatTypingIndicator label="digitando..." />
            )}
          </div>
        </motion.div>
      ) : null}
      <div ref={messagesEndRef} className="h-px w-full shrink-0" />
    </div>
  );
}
