import { z } from "zod";

export const employeeMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  selectedTicketId: z.string().uuid().optional(),
});

export const confirmTicketSchema = z.object({
  action: z.literal("confirm_ticket"),
  draftMessageId: z.string().uuid(),
});

export const cancelTicketSchema = z.object({
  action: z.literal("cancel_ticket"),
  draftMessageId: z.string().uuid(),
});

export const requestAnalystSchema = z.object({
  action: z.literal("request_analyst"),
  reason: z.string().trim().min(1).max(2000).optional(),
});

export const employeeConversationActionSchema = z.discriminatedUnion("action", [
  confirmTicketSchema,
  cancelTicketSchema,
  requestAnalystSchema,
]);

export const analystConversationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim") }),
  z.object({ action: z.literal("return_to_bot") }),
  z.object({ action: z.literal("close") }),
  z.object({
    action: z.literal("send_message"),
    message: z.string().trim().min(1).max(4000),
  }),
]);

export type EmployeeMessageInput = z.infer<typeof employeeMessageSchema>;
export type EmployeeConversationAction = z.infer<
  typeof employeeConversationActionSchema
>;
export type AnalystConversationAction = z.infer<
  typeof analystConversationActionSchema
>;
