import type { AgentAssessment, ToolAction } from "@/lib/agent/tools";
import {
  recordCommentEvidence,
  recordDraftEvidence,
  recordImpactQuestionEvidence,
  recordKnowledgeBaseEvidence,
  recordOperationalStatusEvidence,
  recordTicketListEvidence,
} from "@/lib/agent/confidence";
import { toolOutputSchemas } from "@/lib/mastra/schemas/tool-outputs";

export const TOOL_RUNNING_LABELS: Record<string, string> = {
  search_knowledge_base: "Consultando a Central de Ajuda...",
  check_system_status: "Verificando status dos serviços...",
  list_my_tickets: "Consultando seus chamados...",
  ask_ticket_impact: "Perguntando quem está sendo afetado...",
  create_ticket: "Preparando um rascunho de chamado...",
  add_ticket_comment: "Registrando a informação no chamado...",
  request_helpdesk_analyst: "Encaminhando para um analista...",
};

export function runningLabelForTool(toolName: string, args?: unknown) {
  if (
    toolName === "add_ticket_comment" &&
    args &&
    typeof args === "object" &&
    "ticketCode" in args &&
    typeof args.ticketCode === "string"
  ) {
    return `Consultando o ${args.ticketCode}...`;
  }
  return TOOL_RUNNING_LABELS[toolName] ?? "Consultando informações...";
}

export function actionFromToolOutput(
  toolName: string,
  output: unknown,
): ToolAction | null {
  if (toolName === "search_knowledge_base") {
    const parsed = toolOutputSchemas.search_knowledge_base.safeParse(output);
    if (!parsed.success) return null;
    const { articles } = parsed.data;
    return {
      name: toolName,
      label:
        articles.length === 1
          ? `Consultou a Central de Ajuda (${articles[0].title})`
          : `Consultou a Central de Ajuda (${articles.length} resultado(s))`,
      articles: articles.map((article) => ({
        title: article.title,
        category: article.category,
      })),
    };
  }

  if (toolName === "check_system_status") {
    const parsed = toolOutputSchemas.check_system_status.safeParse(output);
    if (!parsed.success) return null;
    if (!parsed.data.recognized) {
      return {
        name: toolName,
        label: "Verificou status operacional (serviço não reconhecido)",
        services: [],
        systemStatusSource: parsed.data.source,
        systemStatusMessage: parsed.data.message,
      };
    }
    const { services } = parsed.data;
    return {
      name: toolName,
      label:
        services.length === 1
          ? `Verificou status de ${services[0].name}`
          : `Verificou status operacional (${services.length} serviço(s))`,
      services,
      systemStatusSource: parsed.data.source,
      systemStatusMessage: parsed.data.message,
    };
  }

  if (toolName === "list_my_tickets") {
    const parsed = toolOutputSchemas.list_my_tickets.safeParse(output);
    if (!parsed.success) return null;
    const { tickets } = parsed.data;
    return {
      name: toolName,
      label:
        tickets.length === 1
          ? `Consultou o ${tickets[0].code}`
          : tickets.length === 0
            ? "Consultou seus chamados (nenhum aberto)"
            : `Consultou seus chamados (${tickets.length})`,
      tickets,
    };
  }

  if (toolName === "ask_ticket_impact") {
    const parsed = toolOutputSchemas.ask_ticket_impact.safeParse(output);
    if (!parsed.success) return null;
    return {
      name: toolName,
      label: "Perguntou quem está sendo afetado",
      issueSummary: parsed.data.issueSummary,
      impactQuestion: parsed.data.question,
    };
  }

  if (toolName === "create_ticket") {
    const parsed = toolOutputSchemas.create_ticket.safeParse(output);
    if (!parsed.success) return null;
    return {
      name: toolName,
      label: "Classificou a prioridade e preparou o rascunho",
      draft: parsed.data.draft,
      workflowRunId: parsed.data.workflowRunId,
      duplicateMatch: parsed.data.duplicateMatch,
      duplicateCode: parsed.data.duplicateCode,
    };
  }

  if (toolName === "add_ticket_comment") {
    const parsed = toolOutputSchemas.add_ticket_comment.safeParse(output);
    if (!parsed.success) return null;
    return {
      name: toolName,
      label: `Registrou informação no ${parsed.data.ticketCode}`,
    };
  }

  if (toolName === "request_helpdesk_analyst") {
    const parsed = toolOutputSchemas.request_helpdesk_analyst.safeParse(output);
    if (!parsed.success) return null;
    return {
      name: toolName,
      label: "Solicitou atendimento de um analista",
      summary: parsed.data.summary,
    };
  }

  return null;
}

export function applyToolEvidence(assessment: AgentAssessment, action: ToolAction) {
  switch (action.name) {
    case "search_knowledge_base":
      recordKnowledgeBaseEvidence(assessment, action.articles?.length ?? 0);
      return;
    case "check_system_status":
      recordOperationalStatusEvidence(assessment);
      return;
    case "list_my_tickets":
      recordTicketListEvidence(assessment, action.tickets?.length ?? 0);
      return;
    case "ask_ticket_impact":
      recordImpactQuestionEvidence(assessment);
      return;
    case "create_ticket":
      recordDraftEvidence(assessment, action.draft?.priority ?? "MEDIUM");
      return;
    case "add_ticket_comment":
      recordCommentEvidence(assessment);
      return;
    default:
      return;
  }
}
