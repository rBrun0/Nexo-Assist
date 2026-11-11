import { describe, expect, it } from "@jest/globals";

import {
  LOW_CONFIDENCE_THRESHOLD,
  recordKnowledgeBaseEvidence,
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
});
