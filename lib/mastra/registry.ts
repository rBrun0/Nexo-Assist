import type { TicketDraftPresentation } from "@/lib/validations/ticket";

export type OpenTicketStartInput = {
  userId: string;
  conversationId: string;
  title: string;
  description: string;
  type: "INCIDENT" | "REQUEST";
  category:
    | "ACCESS"
    | "NETWORK_VPN"
    | "HARDWARE"
    | "SOFTWARE"
    | "EMAIL"
    | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact?: "self" | "team" | "company" | "unknown";
  priorityReason?: string;
};

export type OpenTicketDraftResult = {
  requiresConfirmation: true;
  draft: TicketDraftPresentation;
  workflowRunId: string;
  duplicateMatch: "none" | "active" | "reopen";
  duplicateCode?: string;
  message: string;
};

export type OpenTicketResumeResult =
  | { cancelled: true }
  | {
      cancelled: false;
      outcome: "created" | "updated" | "reopened" | "linked";
      ticket: { id: string; code: string; priority: string } | null;
    };

type OpenTicketRunner = {
  startDraft: (input: OpenTicketStartInput) => Promise<OpenTicketDraftResult>;
  resume: (runId: string, confirmed: boolean) => Promise<OpenTicketResumeResult>;
};

let runner: OpenTicketRunner | undefined;

export function registerOpenTicketRunner(next: OpenTicketRunner) {
  runner = next;
}

export function getOpenTicketRunner() {
  if (!runner) {
    throw new Error("O workflow de abertura ainda não foi registrado.");
  }
  return runner;
}
