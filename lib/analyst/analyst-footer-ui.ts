import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

type AnalystStatus = AnalystConversationListItem["status"];

const PLACEHOLDER_BY_STATUS: Partial<Record<AnalystStatus, string>> = {
  "Com o agente": "Assuma o atendimento para responder",
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
  const isAssignedToMe =
    status === "Em atendimento" && assignedAnalystId === currentAnalystId;

  const placeholder =
    PLACEHOLDER_BY_STATUS[status] ??
    (assignedAnalystId !== currentAnalystId
      ? "Somente o analista atribuído pode responder."
      : "Escreva sua resposta...");

  return {
    showWaitingBanner: status === "Aguardando",
    showAssignedToolbar: isAssignedToMe,
    canCompose: isAssignedToMe,
    placeholder,
  } as const;
}
