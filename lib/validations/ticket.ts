import { Priority, TicketCategory, TicketType } from "@prisma/client";
import { z } from "zod";

export const ticketImpactSchema = z.enum(["self", "team", "company", "unknown"]);

export const ticketDraftSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(5000),
  type: z.enum(TicketType),
  category: z.enum(TicketCategory),
  priority: z.enum(Priority),
  affectedUserIds: z
    .array(z.string().uuid())
    .min(1)
    .max(50)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Não repita funcionários afetados.",
    }),
});

export const ticketDraftPresentationSchema = ticketDraftSchema.extend({
  impact: ticketImpactSchema.optional(),
  priorityReason: z.string().trim().max(200).optional(),
  slaDeadlineIso: z.string().datetime().optional(),
});

export const createTicketSchema = ticketDraftSchema.extend({
  confirmed: z.literal(true),
});

export const analystTicketStatusSchema = z.object({
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "WAITING_ANALYST",
    "APPROVED",
    "RESOLVED",
    "CLOSED",
  ]),
});

export type TicketDraftInput = z.infer<typeof ticketDraftSchema>;
export type TicketDraftPresentation = z.infer<typeof ticketDraftPresentationSchema>;
export type TicketImpact = z.infer<typeof ticketImpactSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AnalystTicketStatusInput = z.infer<typeof analystTicketStatusSchema>;
