import { Priority, TicketCategory, TicketType } from "@prisma/client";

import type { TicketDraftPresentation } from "@/lib/validations/ticket";

export type ToolTicketSummary = {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
  isOverdue?: boolean;
  slaDeadline?: Date | string | null;
};

export type ToolSystemService = {
  id: string;
  name: string;
  status: string;
};

export type ToolArticleRef = {
  title: string;
  category?: string;
};

export type ToolAction = {
  name: string;
  label: string;
  draft?: TicketDraftPresentation;
  summary?: string;
  tickets?: ToolTicketSummary[];
  services?: ToolSystemService[];
  systemStatusSource?: string;
  systemStatusMessage?: string;
  articles?: ToolArticleRef[];
  impactQuestion?: string;
  issueSummary?: string;
  workflowRunId?: string;
  duplicateMatch?: "none" | "active" | "reopen";
  duplicateCode?: string;
};

export type AgentAssessment = {
  confidenceScore: number;
  handoffReason?: string;
};

export const ticketToolOptions = {
  types: Object.values(TicketType),
  categories: Object.values(TicketCategory),
  priorities: Object.values(Priority),
};
