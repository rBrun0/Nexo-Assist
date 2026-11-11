import { z } from "zod";

export const chatSessionIdSchema = z.string().uuid();

export const manualChatMessageSchema = z.object({
  sessionId: chatSessionIdSchema,
  message: z.string().trim().min(1).max(4000),
});
