import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

type AnalystStatus = AnalystConversationListItem["status"];

const PLACEHOLDER_BY_STATUS: Partial<Record<AnalystStatus, string>> = {
  "Com o agente": "O Nexo Assist ainda está atendendo.",
  Aguardando: "Assuma a conversa para responder",
  Encerrada: "Conversa encerrada.",
};

export function getAnalystFooterUi({
  status,
  assignedAnalystId,
  currentAnalystId,
}: {
  status: AnalystStatus;
  assignedAnalystId: string | null;
  currentAnalystId: string;
}) {
  const isAssignedToMe = status === "Em atendimento" && assignedAnalystId === currentAnalystId;

  const placeholder =
    PLACEHOLDER_BY_STATUS[status] ??
    (assignedAnalystId !== currentAnalystId
      ? "Somente o analista atribuído pode responder."
      : "Escreva sua resposta...");

  return {
    showWaitingBanner: status === "Aguardando",
    showClaimAction: status === "Aguardando",
    showReturnAction: status === "Aguardando" || isAssignedToMe,
    showAssignedToolbar: isAssignedToMe,
    canCompose: isAssignedToMe,
    placeholder,
  } as const;
}
