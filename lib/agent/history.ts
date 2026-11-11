import { MessageSender } from "@prisma/client";
import type { ModelMessage } from "ai";

export type AgentHistoryEntry = {
  sender: MessageSender;
  content: string;
};

export function mapConversationHistory(
  history: AgentHistoryEntry[]
): ModelMessage[] {
  const messages: ModelMessage[] = [];

  for (const message of history) {
    if (message.sender === MessageSender.EMPLOYEE) {
      messages.push({ role: "user", content: message.content });
      continue;
    }

    if (
      message.sender === MessageSender.ASSISTANT ||
      message.sender === MessageSender.ANALYST
    ) {
      messages.push({ role: "assistant", content: message.content });
    }
  }

  return messages;
}
