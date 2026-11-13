import { z } from "zod";

import { ticketDraftPresentationSchema } from "@/lib/validations/ticket";

export const knowledgeBaseOutputSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      category: z.string(),
      keywords: z.string(),
    }),
  ),
});

const systemServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.literal("UNKNOWN"),
});

export const systemStatusOutputSchema = z.discriminatedUnion("recognized", [
  z.object({
    recognized: z.literal(false),
    source: z.literal("not_integrated"),
    availableServices: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
    message: z.string(),
  }),
  z.object({
    recognized: z.literal(true),
    checkedAt: z.string(),
    source: z.literal("not_integrated"),
    services: z.array(systemServiceSchema),
    message: z.string(),
  }),
]);

export const overdueTicketSchema = z.object({
  status: z.literal("OVERDUE"),
  slaDeadline: z.string(),
  daysLate: z.number().int().min(1),
});

export const listedTicketSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  category: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isOverdue: z.boolean(),
  slaDeadline: z.string().nullable(),
  overdue: overdueTicketSchema.optional(),
});

export const listTicketsOutputSchema = z.object({
  tickets: z.array(listedTicketSchema),
});

export const impactChoiceOutputSchema = z.object({
  kind: z.literal("impact_choice"),
  question: z.string(),
  issueSummary: z.string(),
});

export const duplicateMatchSchema = z.enum(["none", "active", "reopen"]);

export const createTicketOutputSchema = z.object({
  requiresConfirmation: z.literal(true),
  draft: ticketDraftPresentationSchema,
  workflowRunId: z.string().min(1),
  duplicateMatch: duplicateMatchSchema,
  duplicateCode: z.string().optional(),
  message: z.string(),
});

export const commentOutputSchema = z.object({
  success: z.literal(true),
  ticketCode: z.string(),
});

export const handoffOutputSchema = z.object({
  success: z.literal(true),
  status: z.literal("HANDOFF_REQUESTED"),
  summary: z.string(),
});

export const toolOutputSchemas = {
  search_knowledge_base: knowledgeBaseOutputSchema,
  check_system_status: systemStatusOutputSchema,
  list_my_tickets: listTicketsOutputSchema,
  ask_ticket_impact: impactChoiceOutputSchema,
  create_ticket: createTicketOutputSchema,
  add_ticket_comment: commentOutputSchema,
  request_helpdesk_analyst: handoffOutputSchema,
} as const;
