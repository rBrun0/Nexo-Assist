import type { EmployeeConversationStatus } from "@/lib/types/employee-conversation";

export type EmployeeStatusUi = {
  label: string;
  aria: string;
  pastelKey: string;
  dotClass: string;
  placeholder: string;
};

export const EMPLOYEE_STATUS_UI: Record<
  EmployeeConversationStatus,
  EmployeeStatusUi
> = {
  BOT_ACTIVE: {
    label: "Assistente online",
    aria: "Status do agente: assistente online",
    pastelKey: "positive",
    dotClass: "bg-status-positive",
    placeholder: "Escreva para o nexo",
  },
  WAITING_HUMAN: {
    label: "Aguardando analista",
    aria: "Status: aguardando analista",
    pastelKey: "warning",
    dotClass: "bg-status-warning",
    placeholder: "Escreva uma mensagem para a fila de atendimento...",
  },
  HUMAN_ACTIVE: {
    label: "Agente pausado",
    aria: "Status: agente pausado, atendimento humano",
    pastelKey: "warning",
    dotClass: "bg-status-warning",
    placeholder: "Escreva uma mensagem para o analista...",
  },
  CLOSED: {
    label: "Conversa encerrada",
    aria: "Status: conversa encerrada",
    pastelKey: "muted",
    dotClass: "bg-slate-400",
    placeholder: "Conversa encerrada",
  },
};

export function getEmployeeStatusUi(
  status: EmployeeConversationStatus | undefined,
): EmployeeStatusUi {
  return EMPLOYEE_STATUS_UI[status ?? "BOT_ACTIVE"];
}

export function isHumanHandoffStatus(
  status: EmployeeConversationStatus | undefined,
) {
  return status === "WAITING_HUMAN" || status === "HUMAN_ACTIVE";
}
