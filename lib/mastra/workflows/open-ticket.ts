import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { duplicateMatchSchema } from "@/lib/mastra/schemas/tool-outputs";
import {
  confirmationGate,
  normalizeOpenTicketDraft,
  persistPreparedTicket,
  prepareOpenTicket,
} from "@/lib/mastra/workflows/open-ticket-logic";
import {
  ticketDraftPresentationSchema,
  ticketDraftSchema,
  ticketImpactSchema,
} from "@/lib/validations/ticket";

const openTicketInputSchema = ticketDraftSchema
  .omit({ affectedUserIds: true })
  .extend({
    userId: z.string().uuid(),
    conversationId: z.string().uuid(),
    impact: ticketImpactSchema.optional(),
    priorityReason: z.string().trim().max(200).optional(),
  });

const duplicateSchema = z.object({
  match: duplicateMatchSchema,
  code: z.string().optional(),
});

const extractedSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid(),
  draft: ticketDraftPresentationSchema,
});

const preparedSchema = extractedSchema.extend({
  duplicate: duplicateSchema,
});

const confirmationSchema = preparedSchema.extend({
  confirmed: z.boolean(),
});

export const openTicketResultSchema = z.object({
  persisted: z.boolean(),
  cancelled: z.boolean(),
  persistentError: z.boolean(),
  outcome: z.enum(["created", "updated", "reopened", "linked"]).nullable(),
  ticket: z
    .object({
      id: z.string(),
      code: z.string(),
      priority: z.string(),
    })
    .nullable(),
});

export const openTicketSuspendSchema = z.object({
  draft: ticketDraftPresentationSchema,
  duplicate: duplicateSchema,
  message: z.string(),
});

const extractDraftStep = createStep({
  id: "extract-draft",
  inputSchema: openTicketInputSchema,
  outputSchema: extractedSchema,
  execute: async ({ inputData }) => ({
    userId: inputData.userId,
    conversationId: inputData.conversationId,
    draft: normalizeOpenTicketDraft(inputData),
  }),
});

const checkDuplicatesStep = createStep({
  id: "check-duplicates",
  inputSchema: extractedSchema,
  outputSchema: preparedSchema,
  execute: async ({ inputData }) =>
    prepareOpenTicket({
      userId: inputData.userId,
      conversationId: inputData.conversationId,
      title: inputData.draft.title,
      description: inputData.draft.description,
      type: inputData.draft.type,
      category: inputData.draft.category,
      priority: inputData.draft.priority,
      impact: inputData.draft.impact,
      priorityReason: inputData.draft.priorityReason,
    }),
});

const requestConfirmationStep = createStep({
  id: "request-confirmation",
  inputSchema: preparedSchema,
  outputSchema: confirmationSchema,
  resumeSchema: z.object({
    confirmed: z.boolean(),
  }),
  suspendSchema: openTicketSuspendSchema,
  execute: async ({ inputData, resumeData, suspend }) => {
    if (confirmationGate(resumeData) === "suspend") {
      return suspend({
        draft: inputData.draft,
        duplicate: inputData.duplicate,
        message:
          "O funcionário precisa confirmar este rascunho antes da gravação.",
      });
    }

    return {
      ...inputData,
      confirmed: confirmationGate(resumeData) === "persist",
    };
  },
});

const persistTicketStep = createStep({
  id: "persist-ticket",
  inputSchema: confirmationSchema,
  outputSchema: openTicketResultSchema,
  execute: async ({ inputData }) => persistPreparedTicket(inputData),
});

const cancelTicketStep = createStep({
  id: "cancel-ticket",
  inputSchema: confirmationSchema,
  outputSchema: openTicketResultSchema,
  execute: async () => ({
    persisted: false,
    cancelled: true,
    persistentError: false,
    outcome: null,
    ticket: null,
  }),
});

export const openTicketWorkflow = createWorkflow({
  id: "openTicketWorkflow",
  inputSchema: openTicketInputSchema,
  outputSchema: openTicketResultSchema,
})
  .then(extractDraftStep)
  .then(checkDuplicatesStep)
  .then(requestConfirmationStep)
  .branch([
    [
      async ({ inputData }) => inputData.confirmed,
      persistTicketStep,
    ],
    [
      async ({ inputData }) => !inputData.confirmed,
      cancelTicketStep,
    ],
  ])
  .commit();
