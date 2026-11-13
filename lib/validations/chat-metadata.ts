import { z } from "zod";

import { ticketDraftPresentationSchema } from "@/lib/validations/ticket";

export const chatOptionSchema = z.object({
  label: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
});

export const ticketChoiceItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(30),
  title: z.string().min(1).max(200),
  status: z.string().min(1).max(40),
  priority: z.string().min(1).max(40),
  category: z.string().min(1).max(40),
  /** Opcional: mensagens antigas sem data continuam parseando. */
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ticketChoiceIntentSchema = z.enum([
  "status",
  "add_info",
  "general",
]);

export const systemStatusServiceSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  status: z.string().min(1).max(40),
});

export const articleRefSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(80).optional(),
});

const optionsField = z.array(chatOptionSchema).max(8).optional();

export const ticketChoiceMetadataSchema = z.object({
  kind: z.literal("ticket_choice"),
  intent: ticketChoiceIntentSchema.default("general"),
  tickets: z.array(ticketChoiceItemSchema).min(1).max(20),
  options: optionsField,
});

export const ticketStatusMetadataSchema = z.object({
  kind: z.literal("ticket_status"),
  ticket: ticketChoiceItemSchema.extend({
    description: z.string().max(5000).optional(),
    isOverdue: z.boolean().optional(),
    slaDeadline: z.string().datetime().nullable().optional(),
  }),
  options: optionsField,
});

export const ticketDraftMetadataSchema = z.object({
  kind: z.literal("ticket_draft"),
  draft: ticketDraftPresentationSchema,
  workflowRunId: z.string().min(1).max(120).optional(),
  duplicateMatch: z.enum(["none", "active", "reopen"]).optional(),
  duplicateCode: z.string().min(1).max(30).optional(),
  confirmed: z.boolean().optional(),
  confirmedAt: z.string().optional(),
  cancelled: z.boolean().optional(),
  cancelledAt: z.string().optional(),
  options: optionsField,
});

export const IMPACT_CHOICE_OPTIONS = [
  { label: "Só eu", message: "Afetado: só eu" },
  { label: "Minha equipe", message: "Afetado: minha equipe" },
  { label: "Toda a empresa", message: "Afetado: toda a empresa" },
  { label: "Não sei", message: "Afetado: não sei" },
] as const;

export const impactChoiceMetadataSchema = z.object({
  kind: z.literal("impact_choice"),
  question: z.string().min(1).max(120).default("Quem está sendo afetado?"),
  issueSummary: z.string().max(200).optional(),
  options: z.array(chatOptionSchema).min(1).max(4),
});

export const systemStatusMetadataSchema = z.object({
  kind: z.literal("system_status"),
  source: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  services: z.array(systemStatusServiceSchema).max(20),
  options: optionsField,
});

export const articleRefsMetadataSchema = z.object({
  kind: z.literal("article_refs"),
  articles: z.array(articleRefSchema).min(1).max(5),
  options: optionsField,
});

export const optionsOnlyMetadataSchema = z.object({
  kind: z.literal("options").optional(),
  options: z.array(chatOptionSchema).max(8).default([]),
});

export const assistantMessageMetadataSchema = z.union([
  ticketChoiceMetadataSchema,
  ticketStatusMetadataSchema,
  ticketDraftMetadataSchema,
  impactChoiceMetadataSchema,
  systemStatusMetadataSchema,
  articleRefsMetadataSchema,
  optionsOnlyMetadataSchema,
]);

export type ChatOption = z.infer<typeof chatOptionSchema>;
export type TicketChoiceItem = z.infer<typeof ticketChoiceItemSchema>;
export type TicketChoiceIntent = z.infer<typeof ticketChoiceIntentSchema>;
export type AssistantMessageMetadata = z.infer<
  typeof assistantMessageMetadataSchema
>;

export function parseAssistantMessageMetadata(
  value: unknown,
): AssistantMessageMetadata | null {
  const parsed = assistantMessageMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
