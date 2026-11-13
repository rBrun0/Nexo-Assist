import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { handoffOutputSchema } from "@/lib/mastra/schemas/tool-outputs";

export const requestHelpdeskAnalystTool = createTool({
  id: "request_helpdesk_analyst",
  description:
    "Transfere a conversa para a fila de analistas (WAITING_HUMAN) e pausa o agente. Use obrigatoriamente quando o funcionário pedir analista, em incidente CRITICAL/vencido que exija pessoa, ou sem evidência suficiente. O summary deve contextualizar o caso para o N1.",
  inputSchema: z.object({
    summary: z.string().trim().min(10).max(2000),
  }),
  outputSchema: handoffOutputSchema,
  execute: async ({ summary }) => ({
    success: true as const,
    status: "HANDOFF_REQUESTED" as const,
    summary,
  }),
});
