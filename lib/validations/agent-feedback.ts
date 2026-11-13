import { z } from "zod";

export const submitAgentFeedbackSchema = z.object({
  messageId: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
});

export type SubmitAgentFeedbackInput = z.infer<typeof submitAgentFeedbackSchema>;
