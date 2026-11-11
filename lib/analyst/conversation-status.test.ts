import { describe, expect, it } from "@jest/globals";

import { getConversationStatusDetail } from "./conversation-status";

const now = new Date("2026-11-07T20:00:00.000Z").getTime();

describe("getConversationStatusDetail", () => {
  it("mostra o tempo de transferência desde o handoff", () => {
    expect(
      getConversationStatusDetail(
        {
          status: "Aguardando",
          assignedAnalystId: null,
          assignedTo: null,
          handoffAt: new Date(now - 25 * 60_000).toISOString(),
          confidenceScore: 100,
          lastMessageSender: "ASSISTANT",
        },
        "analyst-1",
        now
      )
    ).toBe("Transferência · contato em 25 min");
  });

  it("prioriza o código do chamado na transferência", () => {
    expect(
      getConversationStatusDetail(
        {
          status: "Aguardando",
          assignedAnalystId: null,
          assignedTo: null,
          handoffAt: new Date(now - 25 * 60_000).toISOString(),
          confidenceScore: 40,
          lastMessageSender: "ASSISTANT",
          ticketCode: "INC-20311",
        },
        "analyst-1",
        now
      )
    ).toBe("Transferida · INC-20311");
  });

  it("mostra confiança baixa e agente solicitando ajuda", () => {
    expect(
      getConversationStatusDetail(
        {
          status: "Aguardando",
          assignedAnalystId: null,
          assignedTo: null,
          handoffAt: null,
          confidenceScore: 40,
          lastMessageSender: "ASSISTANT",
        },
        "analyst-1",
        now
      )
    ).toBe("Agente pediu ajuda · confiança em 40%");
  });

  it("distingue o analista atual do responsável por outro analista", () => {
    const active = {
      status: "Em atendimento" as const,
      assignedAnalystId: "analyst-1",
      assignedTo: "Ana Souza",
      handoffAt: null,
      confidenceScore: null,
      lastMessageSender: "ANALYST" as const,
    };

    expect(getConversationStatusDetail(active, "analyst-1", now)).toBe(
      "Você está atendendo"
    );
    expect(getConversationStatusDetail(active, "analyst-2", now)).toBe(
      "Ana Souza atendendo"
    );
  });

  it("mostra quando o agente está atendendo", () => {
    expect(
      getConversationStatusDetail(
        {
          status: "Com o agente",
          assignedAnalystId: null,
          assignedTo: null,
          handoffAt: null,
          confidenceScore: 100,
          lastMessageSender: "ASSISTANT",
        },
        "analyst-1",
        now
      )
    ).toBe("Agente atendendo");
  });

  it("identifica quem encerrou com base no responsável e na última mensagem", () => {
    const closed = {
      status: "Encerrada" as const,
      assignedAnalystId: null,
      assignedTo: null,
      handoffAt: null,
      confidenceScore: null,
      lastMessageSender: "ASSISTANT" as const,
    };

    expect(getConversationStatusDetail(closed, "analyst-1", now)).toBe(
      "Resolvida pelo agente"
    );
    expect(
      getConversationStatusDetail(
        { ...closed, assignedAnalystId: "analyst-1" },
        "analyst-1",
        now
      )
    ).toBe("Resolvida pelo analista");
  });
});
