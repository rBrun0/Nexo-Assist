import { z } from "zod";

export const serviceDeskRequestContextSchema = z.object({
  userId: z.string().uuid(),
  userEmail: z.string().trim().min(3).max(200),
  conversationId: z.string().uuid(),
  selectedTicketContext: z.string(),
});

export type ServiceDeskRequestContext = z.infer<
  typeof serviceDeskRequestContextSchema
>;

export function readServiceDeskContext(requestContext: {
  get: (key: string) => unknown;
}) {
  return serviceDeskRequestContextSchema.parse({
    userId: requestContext.get("userId"),
    userEmail: requestContext.get("userEmail"),
    conversationId: requestContext.get("conversationId"),
    selectedTicketContext: requestContext.get("selectedTicketContext") ?? "",
  });
}
