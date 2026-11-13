import { formatMessageTime } from "@/lib/chat/format-message-time";
import { getInitials } from "@/lib/format/person-name";
import { normalizeTicketStatusKey } from "@/lib/analyst/ticket-last-event";
import {
  formatTicketCategoryLabel,
  formatTicketPriorityLabel,
  formatTicketStatusLabel,
} from "@/lib/i18n/ticket-labels";
import type {
  AnalystConversationView,
  ChatHistoryMessage,
} from "@/lib/types/conversation";

export type AnalystTicketItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: "Alta" | "Média" | "Baixa" | "Crítica";
  status: string;
  statusKey: string;
  updatedAt: string;
};

export type AnalystChatMessage = {
  id: string;
  author: "employee" | "analyst" | "assistant" | "system";
  senderUserId: string | null;
  senderUser: {
    id: string;
    name: string;
    role: "EMPLOYEE" | "ANALYST";
    job: string | null;
  } | null;
  text: string;
  time: string;
  createdAt: string;
  readAtByEmployee: string | null;
  thoughtProcess: unknown;
};

export type AnalystConversationTicket = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: AnalystTicketItem["priority"];
  status: string;
  statusKey: string;
} | null;

export type AnalystConversationListItem = {
  id: string;
  employeeUserId: string;
  name: string;
  initials: string;
  job: string | null;
  department: string;
  preview: string;
  time: string;
  /** ISO da última mensagem — formatar na UI com `formatQueueTime`. */
  lastMessageAt: string | null;
  unread: number;
  status: "Aguardando" | "Em atendimento" | "Com o agente" | "Encerrada";
  assignedTo: string | null;
  assignedAnalystId: string | null;
  handoffSummary: string | null;
  handoffReason: string | null;
  handoffAt: string | null;
  confidenceScore: number | null;
  closedAt: string | null;
  lastMessageSender:
    | AnalystConversationView["messages"][number]["sender"]
    | null;
  lastMessageSenderName: string | null;
  lastMessageSenderUserId: string | null;
  ticketCode: string | null;
  conversationTicket: AnalystConversationTicket;
  messages: AnalystChatMessage[];
  tickets: AnalystTicketItem[];
};

const SENDER_TO_AUTHOR: Record<
  AnalystConversationView["messages"][number]["sender"],
  AnalystChatMessage["author"]
> = {
  ANALYST: "analyst",
  EMPLOYEE: "employee",
  SYSTEM: "system",
  ASSISTANT: "assistant",
};

const DOMAIN_STATUS_TO_QUEUE: Record<
  AnalystConversationView["status"],
  AnalystConversationListItem["status"]
> = {
  WAITING_HUMAN: "Aguardando",
  HUMAN_ACTIVE: "Em atendimento",
  BOT_ACTIVE: "Com o agente",
  CLOSED: "Encerrada",
};

function mapPriorityLabel(priority: string): AnalystTicketItem["priority"] {
  const label = formatTicketPriorityLabel(priority);
  const allowed: AnalystTicketItem["priority"][] = [
    "Crítica",
    "Alta",
    "Média",
    "Baixa",
  ];
  return allowed.includes(label as AnalystTicketItem["priority"])
    ? (label as AnalystTicketItem["priority"])
    : "Baixa";
}

export function mapHistoryMessage(
  message: ChatHistoryMessage | AnalystConversationView["messages"][number],
): AnalystChatMessage {
  return {
    id: message.id,
    author: SENDER_TO_AUTHOR[message.sender],
    senderUserId: message.senderUserId,
    senderUser: message.senderUser,
    text: message.content,
    time: formatMessageTime(message.createdAt),
    createdAt: message.createdAt,
    readAtByEmployee: message.readAtByEmployee,
    thoughtProcess: message.thoughtProcess,
  };
}

export function mapConversation(
  record: AnalystConversationView,
): AnalystConversationListItem {
  const lastMessage = record.messages.at(-1);
  const status = DOMAIN_STATUS_TO_QUEUE[record.status];

  const conversationTicket = record.ticket
    ? {
        id: record.ticket.id,
        code: record.ticket.code,
        title: record.ticket.title,
        description: record.ticket.description ?? "",
        category: record.ticket.category
          ? formatTicketCategoryLabel(record.ticket.category)
          : "—",
        priority: record.ticket.priority
          ? mapPriorityLabel(record.ticket.priority)
          : ("Baixa" as const),
        status: record.ticket.status
          ? formatTicketStatusLabel(record.ticket.status)
          : "Aguardando analista",
        statusKey: record.ticket.status
          ? normalizeTicketStatusKey(record.ticket.status)
          : "WAITING_ANALYST",
      }
    : null;

  return {
    id: record.id,
    employeeUserId: record.user.id,
    name: record.user.name,
    initials: getInitials(record.user.name),
    job: record.user.job,
    department: record.user.job?.trim() || record.user.email,
    preview: lastMessage?.content ?? record.handoffSummary ?? "Nova conversa",
    time: lastMessage ? formatMessageTime(lastMessage.createdAt) : "",
    lastMessageAt: lastMessage?.createdAt ?? null,
    unread: record.unreadCount,
    status,
    assignedTo: record.assignedAnalyst?.name ?? null,
    assignedAnalystId: record.assignedAnalystId,
    handoffSummary: record.handoffSummary,
    handoffReason: record.handoffReason,
    handoffAt: record.handoffAt,
    confidenceScore: record.confidenceScore,
    closedAt: record.closedAt,
    lastMessageSender: lastMessage?.sender ?? null,
    lastMessageSenderName: lastMessage?.senderUser?.name ?? null,
    lastMessageSenderUserId: lastMessage?.senderUserId ?? null,
    ticketCode: conversationTicket?.code ?? null,
    conversationTicket,
    messages: record.messages.map(mapHistoryMessage),
    tickets: record.user.tickets.map((ticket) => ({
      id: ticket.id,
      code: ticket.code,
      title: ticket.title,
      description: ticket.description ?? "",
      category: formatTicketCategoryLabel(ticket.category),
      priority: mapPriorityLabel(ticket.priority),
      status: formatTicketStatusLabel(ticket.status),
      statusKey: normalizeTicketStatusKey(ticket.status),
      updatedAt: new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(ticket.updatedAt)),
    })),
  };
}

export type ConversationStatusTone = "waiting" | "active" | "bot" | "closed";

const STATUS_TO_TONE: Record<
  AnalystConversationListItem["status"],
  ConversationStatusTone
> = {
  Aguardando: "waiting",
  "Em atendimento": "active",
  "Com o agente": "bot",
  Encerrada: "closed",
};

const TONE_CLASSES: Record<
  ConversationStatusTone,
  { chip: string; text: string; dot: string }
> = {
  waiting: {
    chip: "bg-amber-100 text-amber-500",
    text: "text-amber-500",
    dot: "bg-amber-300",
  },
  active: {
    chip: "bg-emerald-100 text-emerald-500",
    text: "text-emerald-500",
    dot: "bg-emerald-300",
  },
  bot: {
    chip: "bg-blue-100 text-zinc-800",
    text: "text-zinc-800",
    dot: "bg-blue-300",
  },
  closed: {
    chip: "bg-slate-100 text-slate-500",
    text: "text-slate-400",
    dot: "bg-slate-300",
  },
};

const STATUS_LABELS: Record<AnalystConversationListItem["status"], string> = {
  Aguardando: "Aguardando atendente",
  "Em atendimento": "Em atendimento",
  "Com o agente": "Com o agente",
  Encerrada: "Encerrada",
};

const PRIORITY_COLORS: Record<AnalystTicketItem["priority"], string> = {
  Crítica: "bg-red-50 text-red-700",
  Alta: "bg-orange-50 text-orange-700",
  Média: "bg-amber-50 text-amber-700",
  Baixa: "bg-slate-100 text-slate-600",
};

/** Tom semântico do status da conversa (tokens de UI reutilizáveis). */
export function getConversationStatusTone(
  status: AnalystConversationListItem["status"],
): ConversationStatusTone {
  return STATUS_TO_TONE[status];
}

export function getConversationStatusToneClasses(tone: ConversationStatusTone) {
  return TONE_CLASSES[tone];
}

export function getConversationStatusStyle(
  status: AnalystConversationListItem["status"],
) {
  return getConversationStatusToneClasses(getConversationStatusTone(status))
    .text;
}

export function getConversationStatusLabel(
  status: AnalystConversationListItem["status"],
) {
  return STATUS_LABELS[status];
}

export function getConversationStatusBadgeStyle(
  status: AnalystConversationListItem["status"],
) {
  return getConversationStatusToneClasses(getConversationStatusTone(status))
    .dot;
}

export function getPriorityColor(priority: AnalystTicketItem["priority"]) {
  return PRIORITY_COLORS[priority];
}
