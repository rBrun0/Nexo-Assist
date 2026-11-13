import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { impactChoiceOutputSchema } from "@/lib/mastra/schemas/tool-outputs";

export const askTicketImpactTool = createTool({
  id: "ask_ticket_impact",
  description:
    "Mostra a pergunta 'Quem está sendo afetado?' com opções Só eu, Minha equipe, Toda a empresa e Não sei. Use antes de create_ticket quando o impacto ainda não foi informado.",
  inputSchema: z.object({
    issueSummary: z.string().trim().min(5).max(200),
  }),
  outputSchema: impactChoiceOutputSchema,
  execute: async ({ issueSummary }) => ({
    kind: "impact_choice" as const,
    question: "Quem está sendo afetado?",
    issueSummary,
  }),
});
