import type { ChatHistoryMessage } from "@/lib/types/conversation";

export type EmployeeConversationStatus =
  | "BOT_ACTIVE"
  | "WAITING_HUMAN"
  | "HUMAN_ACTIVE"
  | "CLOSED";

export type EmployeeConversation = {
  id: string;
  status: EmployeeConversationStatus;
  messages: ChatHistoryMessage[];
  messageCount?: number;
  messageLimit?: number;
};

export type EmployeeTicket = {
  id: string;
  code: string;
  title: string;
  status: string;
};
