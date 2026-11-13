import { Priority } from "@prisma/client";

import { markSessionWaitingHuman } from "@/lib/services/conversations";
import { calculateSlaDeadline } from "@/lib/services/ticket-sla";
import {
  createTicketForUserWithRetry,
  findCompatibleTicket,
} from "@/lib/services/tickets";
import {
  ticketDraftPresentationSchema,
  type TicketImpact,
} from "@/lib/validations/ticket";

export function normalizeOpenTicketDraft(input: {
  userId: string;
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
  impact?: TicketImpact;
  priorityReason?: string;
}) {
  const priority =
    input.impact === "team" || input.impact === "company"
      ? Priority.CRITICAL
      : input.priority;

  return ticketDraftPresentationSchema.parse({
    title: input.title,
    description: input.description,
    type: input.type,
    category: input.category,
    priority,
    impact: input.impact,
    priorityReason: input.priorityReason,
    affectedUserIds: [input.userId],
    slaDeadlineIso: calculateSlaDeadline(priority).toISOString(),
  });
}

export type PreparedOpenTicket = {
  userId: string;
  conversationId: string;
  draft: ReturnType<typeof normalizeOpenTicketDraft>;
  duplicate: { match: "none" | "active" | "reopen"; code?: string };
};

export async function prepareOpenTicket(
  input: Parameters<typeof normalizeOpenTicketDraft>[0] & {
    conversationId: string;
  },
): Promise<PreparedOpenTicket> {
  const draft = normalizeOpenTicketDraft(input);
  const found = await findCompatibleTicket(input.userId, draft);
  return {
    userId: input.userId,
    conversationId: input.conversationId,
    draft,
    duplicate:
      found.match === "none"
        ? { match: "none" }
        : { match: found.match, code: found.code },
  };
}

export function confirmationGate(resumeData?: { confirmed: boolean }) {
  if (!resumeData) return "suspend" as const;
  return resumeData.confirmed ? ("persist" as const) : ("cancel" as const);
}

export async function persistPreparedTicket(input: PreparedOpenTicket) {
  try {
    const result = await createTicketForUserWithRetry(input.userId, {
      title: input.draft.title,
      description: input.draft.description,
      type: input.draft.type,
      category: input.draft.category,
      priority: input.draft.priority,
      affectedUserIds: [input.userId],
      confirmed: true,
    });
    return {
      persisted: true as const,
      cancelled: false as const,
      persistentError: false as const,
      outcome: result.outcome,
      ticket: result.ticket
        ? {
            id: result.ticket.id,
            code: result.ticket.code,
            priority: result.ticket.priority,
          }
        : null,
    };
  } catch (error) {
    try {
      await markSessionWaitingHuman(
        input.conversationId,
        input.userId,
        "Não foi possível gravar o chamado no serviço de chamados após novas tentativas.",
      );
    } catch (markError) {
      console.error(
        "Falha ao marcar handoff depois do erro de gravação:",
        markError,
      );
    }
    throw error;
  }
}
