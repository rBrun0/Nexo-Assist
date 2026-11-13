import type { ToolAction } from "@/lib/agent/tools";
import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/agent/confidence";
import {
  agentDecisionSchema,
  type AgentDecision,
} from "@/lib/mastra/schemas/decision";

export function reconcileConfidence(modelScore: number, evidenceScore: number) {
  const model = Number.isFinite(modelScore) ? Math.round(modelScore) : 0;
  const evidence = Number.isFinite(evidenceScore) ? Math.round(evidenceScore) : 0;
  return Math.min(100, Math.max(0, model), Math.min(100, Math.max(0, evidence)));
}

export function confidenceBand(score: number): "low" | "medium" | "high" {
  if (score < LOW_CONFIDENCE_THRESHOLD) return "low";
  if (score >= 80) return "high";
  return "medium";
}

export function fallbackIntent(
  actions: Array<{ name: string }>,
): AgentDecision["intent"] {
  if (actions.some((action) => action.name === "request_helpdesk_analyst")) {
    return "transbordo";
  }
  if (
    actions.some(
      (action) =>
        action.name === "create_ticket" || action.name === "ask_ticket_impact",
    )
  ) {
    return "abertura";
  }
  if (
    actions.some((action) =>
      ["list_my_tickets", "add_ticket_comment", "check_system_status"].includes(
        action.name,
      ),
    )
  ) {
    return "consulta";
  }
  return "duvida";
}

export function fallbackDecision({
  actions,
  evidenceScore,
  rationale,
  priority,
}: {
  actions: ToolAction[];
  evidenceScore: number;
  rationale: string;
  priority?: string | null;
}): AgentDecision {
  const parsedPriority = agentDecisionSchema.shape.priority.safeParse(
    priority ?? null,
  );
  return {
    intent: fallbackIntent(actions),
    priority: parsedPriority.success ? parsedPriority.data : null,
    confidenceScore: Math.min(100, Math.max(0, Math.round(evidenceScore))),
    rationale,
  };
}
