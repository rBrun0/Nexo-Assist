import { describe, expect, it } from "@jest/globals";

import { confidenceBand, reconcileConfidence } from "@/lib/mastra/reconcile-decision";
import { actionFromToolOutput } from "@/lib/mastra/apply-tool-result";
import { handoffReasonForTurn } from "@/lib/mastra/handoff-from-step";
import { overdueTicketSchema } from "@/lib/mastra/schemas/tool-outputs";
import { agentDecisionSchema } from "@/lib/mastra/schemas/decision";

describe("decisão estruturada", () => {
  it("aceita o contrato de intenção, prioridade, confiança e justificativa", () => {
    expect(
      agentDecisionSchema.parse({
        intent: "abertura",
        priority: "HIGH",
        confidenceScore: 84,
        rationale: "Montou um rascunho e aguarda confirmação.",
      }),
    ).toMatchObject({ intent: "abertura", confidenceScore: 84 });
  });

  it("não deixa o modelo subir a confiança acima da evidência", () => {
    expect(reconcileConfidence(96, 40)).toBe(40);
    expect(reconcileConfidence(70, 85)).toBe(70);
    expect(confidenceBand(40)).toBe("low");
    expect(confidenceBand(70)).toBe("medium");
  });

  it("rejeita confiança fora de 0 a 100", () => {
    expect(
      agentDecisionSchema.safeParse({
        intent: "duvida",
        priority: null,
        confidenceScore: 140,
        rationale: "Texto.",
      }).success,
    ).toBe(false);
  });
});

describe("resultado das tools", () => {
  it("expõe chamado atrasado com prazo e dias de atraso", () => {
    const overdue = overdueTicketSchema.parse({
      status: "OVERDUE",
      slaDeadline: "2026-11-10T12:00:00.000Z",
      daysLate: 2,
    });
    const action = actionFromToolOutput("list_my_tickets", {
      tickets: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          code: "INC-1",
          title: "VPN fora",
          description: "Sem acesso.",
          status: "OPEN",
          priority: "HIGH",
          category: "NETWORK_VPN",
          createdAt: "2026-11-10T12:00:00.000Z",
          updatedAt: "2026-11-12T12:00:00.000Z",
          isOverdue: true,
          slaDeadline: overdue.slaDeadline,
          overdue,
        },
      ],
    });

    expect(action?.label).toBe("Consultou o INC-1");
    expect(action?.tickets?.[0]?.isOverdue).toBe(true);
    expect(overdue.daysLate).toBe(2);
  });

  it("ignora saída que não cumpre o schema", () => {
    expect(actionFromToolOutput("search_knowledge_base", { articles: "não" })).toBeNull();
  });
});

describe("guardrail de handoff", () => {
  it("pede analista quando o chamado vinculado está vencido", () => {
    expect(
      handoffReasonForTurn({
        actions: [],
        linkedOverdue: true,
      }),
    ).toBe("O chamado vinculado está com o prazo vencido.");
  });
});
