/** Limite de mensagens por conversa (PRD). Eventos SYSTEM não contam. */
export const CONVERSATION_MESSAGE_LIMIT = 30;

export const TICKET_TYPE_LABELS = {
  INCIDENT: "Incidente (INC)",
  REQUEST: "Requisição (REQ)",
} as const;

export const PRIORITY_LABELS = {
  CRITICAL: "Crítica (Prazo: 1h)",
  HIGH: "Alta (Prazo: 4h úteis)",
  MEDIUM: "Média (Prazo: 3 dias úteis)",
  LOW: "Baixa (Prazo: 5 dias úteis)",
} as const;

export const PRIORITY_SHORT_LABELS = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
} as const;

export const CATEGORY_LABELS = {
  ACCESS: "Acesso",
  NETWORK_VPN: "Rede e VPN",
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  EMAIL: "E-mail",
  OTHER: "Outros",
} as const;

export const TICKET_STATUS_LABELS = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  WAITING_ANALYST: "Aguardando analista",
  APPROVED: "Aprovado",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
} as const;

export const CONFIDENCE_LABELS = {
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
} as const;
