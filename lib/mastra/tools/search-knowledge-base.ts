import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { searchKnowledgeBase } from "@/lib/services/knowledge-base";
import { knowledgeBaseOutputSchema } from "@/lib/mastra/schemas/tool-outputs";

export const searchKnowledgeBaseTool = createTool({
  id: "search_knowledge_base",
  description:
    "Busca e prioriza artigos da Central de Ajuda por relevância. Use antes de responder dúvidas procedimentais de TI.",
  inputSchema: z.object({
    query: z.string().min(2).max(200),
  }),
  outputSchema: knowledgeBaseOutputSchema,
  execute: async ({ query }) => {
    const articles = await searchKnowledgeBase(query);
    return { articles };
  },
});
