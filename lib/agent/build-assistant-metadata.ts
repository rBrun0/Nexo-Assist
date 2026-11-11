import type { Prisma } from "@prisma/client";

import type { ToolAction, ToolTicketSummary } from "@/lib/agent/tools";
import {
  assistantMessageMetadataSchema,
  IMPACT_CHOICE_OPTIONS,
  type ChatOption,
  type TicketChoiceIntent,
  type TicketChoiceItem,
} from "@/lib/validations/chat-metadata";

export const DEFAULT_CHAT_OPTIONS: ChatOption[] = [
  {
    label: "Consultar meus chamados",
    message: "Quero consultar meus chamados.",
  },
  {
    label: "Adicionar informação a um chamado",
    message: "Quero adicionar uma informação a um chamado.",
  },
];

export const ANALYST_OPTION: ChatOption = {
  label: "Falar com um analista",
  message: "Quero falar com um analista.",
};

function toChoiceItem(ticket: {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  updatedAt?: string | Date;
}): TicketChoiceItem {
  const updatedAt =
    ticket.updatedAt instanceof Date
      ? ticket.updatedAt.toISOString()
      : ticket.updatedAt;

  return {
    id: ticket.id,
    code: ticket.code,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function inferTicketChoiceIntent(
  lastUserMessage?: string | null,
): TicketChoiceIntent {
  const normalized = (lastUserMessage ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");

  if (
    /\b(adicionar|complementar|atualizar|informacao|comentario)\b/.test(
      normalized,
    ) ||
    normalized.includes("adicionar informacao") ||
    normalized.includes("adicionar uma informacao")
  ) {
    return "add_info";
  }

  if (/\b(status|andamento|situacao)\b/.test(normalized)) {
    return "status";
  }

  return "general";
}

export function shouldOfferAnalystChip(
  tickets: Array<Pick<ToolTicketSummary, "isOverdue" | "priority">>,
) {
  return tickets.some(
    (ticket) =>
      ticket.isOverdue === true ||
      String(ticket.priority).toUpperCase() === "CRITICAL",
  );
}

const DECLINE_OPTION: ChatOption = {
  label: "Não obrigado",
  message: "Não obrigado.",
};

function ticketActionOptions(
  ticket: TicketChoiceItem,
  includeAnalyst: boolean,
): ChatOption[] {
  const options: ChatOption[] = [
    {
      label: "Adicionar informação",
      message: `Quero adicionar informação ao chamado ${ticket.code} — ${ticket.title}:`,
    },
  ];
  if (includeAnalyst) {
    options.push(ANALYST_OPTION);
  }
  options.push(DECLINE_OPTION);
  return options;
}

function toTicketStatusMetadata(
  source: ToolTicketSummary,
  ticket: TicketChoiceItem,
  includeAnalyst: boolean,
) {
  return assistantMessageMetadataSchema.parse({
    kind: "ticket_status",
    ticket: {
      ...ticket,
      description: source.description,
      isOverdue: source.isOverdue,
      slaDeadline: source.slaDeadline
        ? source.slaDeadline instanceof Date
          ? source.slaDeadline.toISOString()
          : String(source.slaDeadline)
        : null,
    },
    options: ticketActionOptions(ticket, includeAnalyst),
  });
}

export function buildAssistantMetadata({
  actions,
  lastUserMessage,
  selectedTicketId,
}: {
  actions: ToolAction[];
  lastUserMessage?: string | null;
  selectedTicketId?: string | null;
}): Prisma.InputJsonObject {
  const handoffRequested = actions.some(
    (action) => action.name === "request_helpdesk_analyst",
  );

  const draftAction = actions.find(
    (action) => action.name === "create_ticket" && action.draft,
  );
  if (draftAction?.draft) {
    const metadata = assistantMessageMetadataSchema.parse({
      kind: "ticket_draft",
      draft: draftAction.draft,
      options: [],
    });
    return metadata as Prisma.InputJsonObject;
  }

  const impactAction = [...actions]
    .reverse()
    .find((action) => action.name === "ask_ticket_impact");
  if (impactAction) {
    const metadata = assistantMessageMetadataSchema.parse({
      kind: "impact_choice",
      question: impactAction.impactQuestion ?? "Quem está sendo afetado?",
      issueSummary: impactAction.issueSummary,
      options: [...IMPACT_CHOICE_OPTIONS],
    });
    return metadata as Prisma.InputJsonObject;
  }

  // Handoff já ocorreu: não oferecer de novo o chip de analista.
  if (handoffRequested) {
    const metadata = assistantMessageMetadataSchema.parse({
      options: [],
    });
    return metadata as Prisma.InputJsonObject;
  }

  const listAction = [...actions]
    .reverse()
    .find((action) => action.name === "list_my_tickets" && action.tickets);

  if (listAction?.tickets) {
    const intent = inferTicketChoiceIntent(lastUserMessage);
    const tickets = listAction.tickets.map(toChoiceItem);
    const includeAnalyst = shouldOfferAnalystChip(listAction.tickets);

    if (tickets.length === 0) {
      const metadata = assistantMessageMetadataSchema.parse({
        options: DEFAULT_CHAT_OPTIONS,
      });
      return metadata as Prisma.InputJsonObject;
    }

    const selectedSource = selectedTicketId
      ? listAction.tickets.find((ticket) => ticket.id === selectedTicketId)
      : undefined;
    const selectedChoice = selectedSource
      ? toChoiceItem(selectedSource)
      : undefined;

    if (selectedSource && selectedChoice) {
      return toTicketStatusMetadata(
        selectedSource,
        selectedChoice,
        shouldOfferAnalystChip([selectedSource]),
      ) as Prisma.InputJsonObject;
    }

    if (tickets.length === 1) {
      return toTicketStatusMetadata(
        listAction.tickets[0],
        tickets[0],
        includeAnalyst,
      ) as Prisma.InputJsonObject;
    }

    const metadata = assistantMessageMetadataSchema.parse({
      kind: "ticket_choice",
      intent,
      tickets,
      options: includeAnalyst ? [ANALYST_OPTION] : [],
    });
    return metadata as Prisma.InputJsonObject;
  }

  const statusAction = [...actions]
    .reverse()
    .find((action) => action.name === "check_system_status" && action.services);

  if (statusAction?.services) {
    const metadata = assistantMessageMetadataSchema.parse({
      kind: "system_status",
      source: statusAction.systemStatusSource ?? "not_integrated",
      message:
        statusAction.systemStatusMessage ??
        "Não há integração de monitoramento configurada.",
      services: statusAction.services,
      options: DEFAULT_CHAT_OPTIONS,
    });
    return metadata as Prisma.InputJsonObject;
  }

  const kbAction = [...actions]
    .reverse()
    .find(
      (action) => action.name === "search_knowledge_base" && action.articles,
    );

  if (kbAction?.articles && kbAction.articles.length > 0) {
    const metadata = assistantMessageMetadataSchema.parse({
      kind: "article_refs",
      articles: kbAction.articles,
      options: DEFAULT_CHAT_OPTIONS,
    });
    return metadata as Prisma.InputJsonObject;
  }

  const metadata = assistantMessageMetadataSchema.parse({
    options: DEFAULT_CHAT_OPTIONS,
  });
  return metadata as Prisma.InputJsonObject;
}
