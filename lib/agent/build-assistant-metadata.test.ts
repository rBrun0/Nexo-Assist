import {
  ANALYST_OPTION,
  DEFAULT_CHAT_OPTIONS,
  END_CONVERSATION_OPTION,
  buildAssistantMetadata,
  inferTicketChoiceIntent,
  shouldOfferAnalystChip,
} from "@/lib/agent/build-assistant-metadata";
import type { ToolAction } from "@/lib/agent/tools";
import {
  IMPACT_CHOICE_OPTIONS,
  parseAssistantMessageMetadata,
} from "@/lib/validations/chat-metadata";
import { Priority, TicketCategory, TicketType } from "@prisma/client";

const ticketA = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "NX-001",
  title: "VPN fora",
  description: "Não conecta",
  status: "OPEN",
  priority: "HIGH",
  category: "NETWORK_VPN",
  createdAt: "2026-10-16T12:00:00.000Z",
  updatedAt: "2026-10-16T15:00:00.000Z",
  isOverdue: false,
  slaDeadline: new Date("2026-11-08T18:00:00.000Z"),
};

const ticketB = {
  id: "22222222-2222-4222-8222-222222222222",
  code: "NX-002",
  title: "Acesso SAP",
  status: "IN_PROGRESS",
  priority: "MEDIUM",
  category: "ACCESS",
  // sem updatedAt: mensagens/metadata legados ainda devem parsear
};

const overdueTicket = {
  ...ticketA,
  id: "44444444-4444-4444-8444-444444444444",
  code: "INC-20311",
  isOverdue: true,
  priority: "MEDIUM",
};

describe("inferTicketChoiceIntent", () => {
  it("detecta add_info e status", () => {
    expect(inferTicketChoiceIntent("Quero adicionar informação")).toBe(
      "add_info",
    );
    expect(inferTicketChoiceIntent("Qual o status do meu chamado?")).toBe(
      "status",
    );
    expect(inferTicketChoiceIntent("Oi")).toBe("general");
  });
});

describe("shouldOfferAnalystChip", () => {
  it("só oferece para overdue ou CRITICAL", () => {
    expect(shouldOfferAnalystChip([ticketA, ticketB])).toBe(false);
    expect(shouldOfferAnalystChip([overdueTicket])).toBe(true);
    expect(
      shouldOfferAnalystChip([
        { ...ticketA, priority: "CRITICAL", isOverdue: false },
      ]),
    ).toBe(true);
  });
});

describe("buildAssistantMetadata", () => {
  it("prioriza impacto sobre lista de tickets na mesma passagem", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [ticketA, ticketB],
          },
          {
            name: "ask_ticket_impact",
            label: "perguntou impacto",
            issueSummary: "VPN erro 809",
            impactQuestion: "Quem está sendo afetado?",
          },
        ],
      }),
    );

    expect(metadata).toMatchObject({
      kind: "impact_choice",
      question: "Quem está sendo afetado?",
      issueSummary: "VPN erro 809",
      options: [...IMPACT_CHOICE_OPTIONS],
    });
  });

  it("prioriza rascunho mesmo se ask_ticket_impact rodou antes", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "ask_ticket_impact",
            label: "perguntou impacto",
            issueSummary: "VPN erro 809",
          },
          {
            name: "create_ticket",
            label: "rascunho",
            draft: {
              title: "VPN corporativa erro 809",
              description: "Notebook não conecta na VPN com erro 809",
              type: TicketType.INCIDENT,
              category: TicketCategory.NETWORK_VPN,
              priority: Priority.HIGH,
              affectedUserIds: ["33333333-3333-4333-8333-333333333333"],
              impact: "self",
              slaDeadlineIso: "2026-11-08T17:00:00.000Z",
            },
          },
        ],
      }),
    );

    expect(metadata?.kind).toBe("ticket_draft");
    if (metadata && metadata.kind === "ticket_draft") {
      expect(metadata.draft.impact).toBe("self");
      expect(metadata.draft.slaDeadlineIso).toBe("2026-11-08T17:00:00.000Z");
    }
  });

  it("prioriza rascunho de chamado sem chip de analista", () => {
    const actions: ToolAction[] = [
      {
        name: "list_my_tickets",
        label: "listou",
        tickets: [ticketA, ticketB],
      },
      {
        name: "create_ticket",
        label: "rascunho",
        draft: {
          title: "Novo chamado de teste",
          description: "Descrição longa o suficiente",
          type: TicketType.INCIDENT,
          category: TicketCategory.SOFTWARE,
          priority: Priority.LOW,
          affectedUserIds: ["33333333-3333-4333-8333-333333333333"],
        },
      },
    ];

    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({ actions }),
    );
    expect(metadata?.kind).toBe("ticket_draft");
    if (metadata && "options" in metadata) {
      expect(metadata.options ?? []).toEqual([]);
    }
  });

  it("monta ticket_choice sem analista quando nao ha overdue", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [ticketA, ticketB],
          },
        ],
        lastUserMessage: "qual o status dos meus chamados?",
      }),
    );

    expect(metadata).toMatchObject({
      kind: "ticket_choice",
      intent: "status",
      options: [],
    });
    if (metadata && metadata.kind === "ticket_choice") {
      expect(metadata.tickets[0]?.updatedAt).toBe("2026-10-16T15:00:00.000Z");
      expect(metadata.tickets[1]?.updatedAt).toBeUndefined();
    }
  });

  it("inclui analista em ticket_choice quando ha chamado vencido", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [ticketA, overdueTicket],
          },
        ],
      }),
    );

    expect(metadata).toMatchObject({
      kind: "ticket_choice",
      options: [ANALYST_OPTION],
    });
  });

  it("monta ticket_status com Não obrigado e analista só se overdue/critical", () => {
    const decline = { label: "Não obrigado", message: "Não obrigado." };
    const normal = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [ticketA],
          },
        ],
      }),
    );
    expect(normal?.kind).toBe("ticket_status");
    if (normal && "options" in normal) {
      expect(normal.options ?? []).not.toContainEqual(ANALYST_OPTION);
      expect(normal.options ?? []).toContainEqual(decline);
      expect(normal.options ?? []).toContainEqual(END_CONVERSATION_OPTION);
    }

    const overdue = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [overdueTicket],
          },
        ],
      }),
    );
    if (overdue && "options" in overdue) {
      expect(overdue.options ?? []).toContainEqual(ANALYST_OPTION);
      expect(overdue.options ?? []).toContainEqual(decline);
    }
  });

  it("prioriza ticket_status do chamado selecionado mesmo com varios na lista", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [ticketA, ticketB],
          },
        ],
        selectedTicketId: ticketB.id,
      }),
    );

    expect(metadata?.kind).toBe("ticket_status");
    if (metadata && metadata.kind === "ticket_status") {
      expect(metadata.ticket.id).toBe(ticketB.id);
      expect(metadata.options ?? []).toContainEqual({
        label: "Não obrigado",
        message: "Não obrigado.",
      });
    }
  });

  it("usa chips padrao sem analista quando lista vazia", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "list_my_tickets",
            label: "listou",
            tickets: [],
          },
        ],
      }),
    );

    expect(metadata).toMatchObject({
      options: [...DEFAULT_CHAT_OPTIONS, END_CONVERSATION_OPTION],
    });
  });

  it("omite chips apos handoff", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "request_helpdesk_analyst",
            label: "Solicitou analista",
            summary: "Pedido do funcionario",
          },
        ],
      }),
    );
    expect(metadata).toMatchObject({ options: [] });
  });

  it("monta system_status e article_refs sem analista", () => {
    const status = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "check_system_status",
            label: "status",
            services: [{ id: "vpn", name: "VPN", status: "UNKNOWN" }],
            systemStatusSource: "not_integrated",
            systemStatusMessage: "Sem integração",
          },
        ],
      }),
    );
    expect(status?.kind).toBe("system_status");
    if (status && "options" in status) {
      expect(status.options).toEqual([
        ...DEFAULT_CHAT_OPTIONS,
        END_CONVERSATION_OPTION,
      ]);
    }

    const articles = parseAssistantMessageMetadata(
      buildAssistantMetadata({
        actions: [
          {
            name: "search_knowledge_base",
            label: "kb",
            articles: [{ title: "Como resetar senha", category: "ACCESS" }],
          },
        ],
      }),
    );
    expect(articles?.kind).toBe("article_refs");
  });

  it("usa chips padrao quando nao ha bloco rico", () => {
    const metadata = parseAssistantMessageMetadata(
      buildAssistantMetadata({ actions: [] }),
    );
    expect(metadata).toMatchObject({
      options: [...DEFAULT_CHAT_OPTIONS, END_CONVERSATION_OPTION],
    });
  });
});
