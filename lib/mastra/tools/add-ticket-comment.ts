import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { readServiceDeskContext } from "@/lib/mastra/request-context";
import { commentOutputSchema } from "@/lib/mastra/schemas/tool-outputs";
import { createTicketCommentForUser } from "@/lib/services/tickets";

export const addTicketCommentTool = createTool({
  id: "add_ticket_comment",
  description:
    "Adiciona uma informação a um chamado do funcionário autenticado. Use quando ele pedir explicitamente para complementar um chamado.",
  inputSchema: z.object({
    ticketCode: z.string().min(5).max(30),
    message: z.string().trim().min(3).max(2000),
  }),
  outputSchema: commentOutputSchema,
  execute: async ({ ticketCode, message }, context) => {
    const { userId, userEmail } = readServiceDeskContext(context.requestContext);
    const comment = await createTicketCommentForUser(
      userId,
      userEmail,
      ticketCode,
      message,
    );
    return { success: true as const, ticketCode: comment.ticketCode };
  },
});
