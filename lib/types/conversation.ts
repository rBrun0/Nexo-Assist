import type { AssistantMessageMetadata } from "@/lib/validations/chat-metadata";

export type TicketSummaryView = {
  id: string;
  code: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  isOverdue?: boolean;
  updatedAt: string;
};

export type ConversationMessageView = {
  id: string;
  chatSessionId?: string;
  sender: "EMPLOYEE" | "ASSISTANT" | "ANALYST" | "SYSTEM";
  senderUserId: string | null;
  senderUser: { id: string; name: string; role: "EMPLOYEE" | "ANALYST" } | null;
  content: string;
  createdAt: string;
  thoughtProcess: unknown;
  metadata: AssistantMessageMetadata | Record<string, unknown> | null | unknown;
  readAtByEmployee: string | null;
  readAtByAnalyst: string | null;
};

export type { AssistantMessageMetadata };

/** Histórico carregado pela Server Action / TanStack Query. */
export type ChatHistoryMessage = ConversationMessageView & {
  chatSessionId: string;
};

export type AnalystConversationView = {
  id: string;
  status: "BOT_ACTIVE" | "WAITING_HUMAN" | "HUMAN_ACTIVE" | "CLOSED";
  handoffSummary: string | null;
  handoffReason: string | null;
  handoffAt: string | null;
  confidenceScore: number | null;
  closedAt: string | null;
  assignedAnalystId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    job: string | null;
    tickets: TicketSummaryView[];
  };
  assignedAnalyst: { id: string; name: string } | null;
  ticket: { id: string; code: string; title: string } | null;
  messages: ConversationMessageView[];
  unreadCount: number;
};
