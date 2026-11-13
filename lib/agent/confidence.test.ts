import { describe, expect, it } from "@jest/globals";

import {
  LOW_CONFIDENCE_THRESHOLD,
  recordDraftEvidence,
  recordKnowledgeBaseEvidence,
  recordOperationalStatusEvidence,
  recordReplyWithoutTools,
  recordTicketListEvidence,
  buildPublicRationale,
} from "./confidence";

describe("confiança baseada na Central de Ajuda", () => {
  it("marca uma busca sem resultados como baixa confiança", () => {
    const assessment = { confidenceScore: 100 };

    recordKnowledgeBaseEvidence(assessment, 0);

    expect(assessment).toEqual({
      confidenceScore: 40,
      handoffReason:
        "A busca na Central de Ajuda não encontrou artigos relevantes.",
    });
    expect(assessment.confidenceScore).toBeLessThan(LOW_CONFIDENCE_THRESHOLD);
  });

  it("registra confiança alta quando há artigos encontrados e limpa o motivo anterior", () => {
    const assessment = {
      confidenceScore: 40,
      handoffReason: "Nenhum artigo encontrado.",
    };

    recordKnowledgeBaseEvidence(assessment, 2);

    expect(assessment).toEqual({ confidenceScore: 85, handoffReason: undefined });
    expect(assessment.confidenceScore).toBeGreaterThanOrEqual(
      LOW_CONFIDENCE_THRESHOLD
    );
  });

  it("baixa a confiança quando o status operacional não está integrado", () => {
    const assessment = { confidenceScore: 100 };
    recordOperationalStatusEvidence(assessment);
    expect(assessment.confidenceScore).toBe(60);
    expect(assessment.confidenceScore).toBeGreaterThanOrEqual(
      LOW_CONFIDENCE_THRESHOLD,
    );
  });

  it("não apaga uma busca sem artigos ao consultar chamados", () => {
    const assessment = { confidenceScore: 40 };
    recordTicketListEvidence(assessment, 2);
    expect(assessment.confidenceScore).toBe(40);
  });

  it("trata rascunho crítico como confiança média e resposta sem tool como incerta", () => {
    const draft = { confidenceScore: 100 };
    recordDraftEvidence(draft, "CRITICAL");
    expect(draft.confidenceScore).toBe(70);

    const bare = { confidenceScore: 100 };
    recordReplyWithoutTools(bare);
    expect(bare.confidenceScore).toBe(62);
    expect(bare.confidenceScore).toBeGreaterThanOrEqual(LOW_CONFIDENCE_THRESHOLD);
  });

  it("explica a decisão com a evidência usada", () => {
    expect(
      buildPublicRationale({
        actions: [{ name: "create_ticket" }],
        confidenceScore: 84,
        requestedHuman: false,
        usedFallback: false,
      }),
    ).toMatch(/confirmação/);
    expect(
      buildPublicRationale({
        actions: [],
        confidenceScore: 40,
        requestedHuman: true,
        handoffReason: "O caso foi classificado como crítico.",
        usedFallback: false,
      }),
    ).toBe("O caso foi classificado como crítico.");
  });
});
