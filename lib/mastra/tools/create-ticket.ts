import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { readServiceDeskContext } from "@/lib/mastra/request-context";
import { getOpenTicketRunner } from "@/lib/mastra/registry";
import { createTicketOutputSchema } from "@/lib/mastra/schemas/tool-outputs";
import {
  ticketDraftSchema,
  ticketImpactSchema,
} from "@/lib/validations/ticket";

export const createTicketTool = createTool({
  id: "create_ticket",
  description:
    "Prepara um rascunho de chamado com tipo, categoria, prioridade e impacto. Não persiste o ticket; a interface pedirá confirmação. Informe impact (self/team/company/unknown) e priorityReason. O prazo de SLA é calculado no servidor.",
  inputSchema: ticketDraftSchema.omit({ affectedUserIds: true }).extend({
    impact: ticketImpactSchema.optional(),
    priorityReason: z.string().trim().max(200).optional(),
  }),
  outputSchema: createTicketOutputSchema,
  execute: async (input, context) => {
    const session = readServiceDeskContext(context.requestContext);
    return getOpenTicketRunner().startDraft({
      ...input,
      userId: session.userId,
      conversationId: session.conversationId,
    });
  },
});
