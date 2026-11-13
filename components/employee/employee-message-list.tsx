"use client";

import type { RefObject } from "react";
import { motion } from "motion/react";

import { AgentActivityTrail } from "@/components/chat/agent-activity-trail";
import { AssistantMessageBlocks } from "@/components/chat/assistant-message-blocks";
import { ChatMessageFrame } from "@/components/chat/chat-message-frame";
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator";
import type { AgentActivityStep } from "@/lib/agent/activity";
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
    <div className="flex flex-col gap-5 px-1 py-5 sm:px-2 sm:py-6">
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
            previousCreatedAt={index > 0 ? messages[index - 1].createdAt : null}
            isSystem={isSystemMessage}
            systemLabel={chatMessage.content}
            senderLabel={senderLabel}
            thoughtProcess={
              isAssistantMessage ? chatMessage.thoughtProcess : undefined
            }
            messageId={isAssistantMessage ? chatMessage.id : undefined}
            thoughtHeaderLayout={
              isAssistantMessage ? "label-start" : "stacked"
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
                className={`relative rounded-xl px-4 py-2.5 ${
                  isEmployeeMessage
                    ? "rounded-br-sm bg-chat-user text-white"
                    : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap text-[14.5px] leading-6">
                  {" "}
                  {/* TODO -> Definir esse tamanho de letra pra fonte padrão do chat */}
                  {chatMessage.content}
                </p>
              </div>
            )}
          </ChatMessageFrame>
        );
      })}
      {isSendingMessage || streamedResponseText ? (
        <motion.div
          className="flex justify-start"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="min-w-0 w-full max-w-[min(92%,720px)]">
            <div className="mb-1 flex min-w-0 items-center gap-3 py-0.5">
              <p className="shrink-0 px-1 text-[11px] font-medium text-slate-500">
                Nexo Assist
              </p>
              <AgentActivityTrail
                steps={agentActivitySteps}
                className="min-w-0 flex-1"
              />
            </div>
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
