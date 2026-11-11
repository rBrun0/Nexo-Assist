import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/agent/confidence";

export type AnalystConversationStatusData = {
  status: "Aguardando" | "Em atendimento" | "Com o agente" | "Encerrada";
  assignedAnalystId: string | null;
  assignedTo: string | null;
  handoffAt: string | null;
  confidenceScore: number | null;
  lastMessageSender: "EMPLOYEE" | "ASSISTANT" | "ANALYST" | "SYSTEM" | null;
  ticketCode?: string | null;
};

function formatHandoffWait(handoffAt: string, now: number) {
  const timestamp = new Date(handoffAt).getTime();
  if (!Number.isFinite(timestamp)) return "contato pendente";

  const elapsedMinutes = Math.floor(Math.max(0, now - timestamp) / 60_000);
  if (elapsedMinutes < 1) return "contato agora";
  if (elapsedMinutes < 60) return `contato em ${elapsedMinutes} min`;

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return minutes === 0
    ? `contato em ${hours} h`
    : `contato em ${hours} h ${minutes} min`;
}

export function getConversationStatusDetail(
  conversation: AnalystConversationStatusData,
  currentAnalystId: string,
  now: number
) {
  if (conversation.status === "Aguardando") {
    if (conversation.ticketCode) {
      return `Transferida · ${conversation.ticketCode}`;
    }

    if (
      conversation.confidenceScore !== null &&
      conversation.confidenceScore < LOW_CONFIDENCE_THRESHOLD
    ) {
      return `Agente pediu ajuda · confiança em ${conversation.confidenceScore}%`;
    }

    return conversation.handoffAt
      ? `Transferência · ${formatHandoffWait(conversation.handoffAt, now)}`
      : "Transferência · aguardando analista";
  }

  if (conversation.status === "Em atendimento") {
    return conversation.assignedAnalystId === currentAnalystId
      ? "Você está atendendo"
      : `${conversation.assignedTo ?? "Analista"} atendendo`;
  }

  if (conversation.status === "Com o agente") {
    return "Agente atendendo";
  }

  if (conversation.assignedAnalystId) {
    return "Resolvida pelo analista";
  }

  return conversation.lastMessageSender === "ASSISTANT"
    ? "Resolvida pelo agente"
    : "Conversa encerrada";
}
