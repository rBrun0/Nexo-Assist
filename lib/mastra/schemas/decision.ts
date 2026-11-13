import { z } from "zod";

export const agentIntentSchema = z.enum([
  "duvida",
  "abertura",
  "consulta",
  "transbordo",
]);

export const agentPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const agentDecisionSchema = z.object({
  intent: agentIntentSchema,
  priority: agentPrioritySchema.nullable(),
  confidenceScore: z.number().int().min(0).max(100),
  rationale: z.string().trim().min(1).max(400),
});

export type AgentDecision = z.infer<typeof agentDecisionSchema>;
