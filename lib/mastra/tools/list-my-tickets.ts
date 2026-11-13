import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getEmployeeTicketsForAgent } from "@/lib/services/conversations";
import { daysPastDeadline } from "@/lib/services/ticket-sla";
import { readServiceDeskContext } from "@/lib/mastra/request-context";
import { listTicketsOutputSchema } from "@/lib/mastra/schemas/tool-outputs";

export const listMyTicketsTool = createTool({
  id: "list_my_tickets",
  description:
    "Consulta os chamados do funcionário autenticado; nunca consulte chamados de terceiros.",
  inputSchema: z.object({
    includeClosed: z.boolean().default(false),
  }),
  outputSchema: listTicketsOutputSchema,
  execute: async ({ includeClosed }, context) => {
    const { userId } = readServiceDeskContext(context.requestContext);
    const tickets = await getEmployeeTicketsForAgent(userId);
    const visible = includeClosed
      ? tickets
      : tickets.filter((ticket) => !["CLOSED", "RESOLVED"].includes(ticket.status));

    return {
      tickets: visible.map((ticket) => {
        const slaDeadline = ticket.slaDeadline
          ? new Date(ticket.slaDeadline).toISOString()
          : null;
        const overdue =
          ticket.isOverdue && slaDeadline
            ? {
                status: "OVERDUE" as const,
                slaDeadline,
                daysLate: daysPastDeadline(slaDeadline),
              }
            : undefined;
        return {
          id: ticket.id,
          code: ticket.code,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          createdAt: new Date(ticket.createdAt).toISOString(),
          updatedAt: new Date(ticket.updatedAt).toISOString(),
          isOverdue: ticket.isOverdue,
          slaDeadline,
          ...(overdue ? { overdue } : {}),
        };
      }),
    };
  },
});
