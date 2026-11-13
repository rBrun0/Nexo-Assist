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

function lowerConfidence(assessment: AgentAssessment, score: number) {
  if (assessment.confidenceScore > score) {
    assessment.confidenceScore = score;
  }
}

/** Status operacional desconhecido: não confirma disponibilidade. */
export function recordOperationalStatusEvidence(assessment: AgentAssessment) {
  lowerConfidence(assessment, 60);
}

/** Lista de chamados do próprio funcionário, sem apagar uma busca sem artigos. */
export function recordTicketListEvidence(
  assessment: AgentAssessment,
  ticketCount: number,
) {
  if (assessment.confidenceScore < 100) return;
  assessment.confidenceScore = ticketCount > 0 ? 88 : 72;
}

export function recordImpactQuestionEvidence(assessment: AgentAssessment) {
  if (assessment.confidenceScore < 100) return;
  assessment.confidenceScore = 78;
}

export function recordDraftEvidence(
  assessment: AgentAssessment,
  priority: string,
) {
  if (assessment.confidenceScore < LOW_CONFIDENCE_THRESHOLD) return;
  const next = priority.toUpperCase() === "CRITICAL" ? 70 : 84;
  lowerConfidence(assessment, next);
}

export function recordCommentEvidence(assessment: AgentAssessment) {
  if (assessment.confidenceScore === 100) {
    assessment.confidenceScore = 90;
  }
}

/** Resposta sem tool: não tratar o palpite como certeza. */
export function recordReplyWithoutTools(assessment: AgentAssessment) {
  if (assessment.confidenceScore >= 100) {
    assessment.confidenceScore = 62;
  }
}

export function buildPublicRationale(input: {
  actions: Array<{ name: string }>;
  confidenceScore: number;
  requestedHuman: boolean;
  handoffReason?: string;
  usedFallback: boolean;
}) {
  if (input.usedFallback) {
    return "O modelo não retornou texto útil; foi enviada uma mensagem de erro honesta ao funcionário.";
  }
  if (input.requestedHuman) {
    return (
      input.handoffReason ??
      "O atendimento foi encaminhado para uma pessoa."
    );
  }

  const names = new Set(input.actions.map((action) => action.name));
  if (
    names.has("search_knowledge_base") &&
    input.confidenceScore < LOW_CONFIDENCE_THRESHOLD
  ) {
    return "A Central de Ajuda não trouxe artigo suficiente para orientar com segurança.";
  }
  if (names.has("create_ticket")) {
    return "Montou um rascunho com tipo, categoria e prioridade. O chamado só é gravado depois da confirmação.";
  }
  if (names.has("add_ticket_comment")) {
    return "Registrou a informação no chamado do próprio funcionário.";
  }
  if (names.has("check_system_status")) {
    return "Consultou o status operacional e não confirmou disponibilidade: não há monitoramento integrado.";
  }
  if (names.has("list_my_tickets") && names.has("search_knowledge_base")) {
    return "Cruzou os chamados do funcionário com a Central de Ajuda antes de responder.";
  }
  if (names.has("list_my_tickets")) {
    return "Respondeu com base nos chamados do funcionário autenticado.";
  }
  if (names.has("search_knowledge_base")) {
    return "Respondeu com base em artigos da Central de Ajuda.";
  }
  if (names.has("ask_ticket_impact")) {
    return "Ainda falta o impacto para classificar a prioridade com segurança.";
  }
  if (input.actions.length === 0) {
    return "Respondeu com o contexto da conversa, sem consultar chamados nem a Central de Ajuda.";
  }
  return "As ações listadas usaram os dados da sessão e as informações disponíveis.";
}
