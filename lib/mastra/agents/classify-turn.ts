import { Agent } from "@mastra/core/agent";

import { serviceDeskModelId } from "@/lib/mastra/agents/service-desk";

export const classifyTurnAgent = new Agent({
  id: "classify-turn",
  name: "Classificar turno",
  instructions:
    "Classifique o turno do service desk de TI. Devolva só os campos do schema: intenção, prioridade, confiança de 0 a 100 e uma justificativa curta e pública. Não descreva cadeia de pensamento.",
  model: () => serviceDeskModelId(),
  maxRetries: 0,
});
