import type { AgentAssessment } from "@/lib/agent/tools";

export const LOW_CONFIDENCE_THRESHOLD = 50;

export function recordKnowledgeBaseEvidence(
  assessment: AgentAssessment,
  resultCount: number
) {
  assessment.confidenceScore = resultCount === 0 ? 40 : 85;
  assessment.handoffReason =
    resultCount === 0
      ? "A busca na Central de Ajuda não encontrou artigos relevantes."
      : undefined;
}
