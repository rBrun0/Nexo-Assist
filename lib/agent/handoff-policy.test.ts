import { describe, expect, it } from "@jest/globals";

import {
  employeeAskedForAnalyst,
  mandatoryHandoffReason,
} from "./handoff-policy";

describe("handoff obrigatório", () => {
  it("reconhece o pedido de analista sem confundir consulta de chamado", () => {
    expect(employeeAskedForAnalyst("Quero falar com um analista.")).toBe(true);
    expect(employeeAskedForAnalyst("Pode me passar para o analista?")).toBe(
      true,
    );
    expect(employeeAskedForAnalyst("Quero consultar meus chamados.")).toBe(
      false,
    );
    expect(
      employeeAskedForAnalyst("Quero saber sobre o chamado INC-20311 — VPN"),
    ).toBe(false);
  });

  it("prioriza o pedido da pessoa, depois prazo vencido e prioridade crítica", () => {
    expect(
      mandatoryHandoffReason({
        employeeMessage: "Quero falar com um analista.",
        draftPriority: "CRITICAL",
        linkedOverdue: true,
      }),
    ).toMatch(/analista/);
    expect(
      mandatoryHandoffReason({
        employeeMessage: "A VPN caiu.",
        linkedOverdue: true,
        draftPriority: "CRITICAL",
      }),
    ).toMatch(/vencido/);
    expect(
      mandatoryHandoffReason({
        draftPriority: "CRITICAL",
        linkedPriority: "HIGH",
      }),
    ).toMatch(/crítico/);
    expect(
      mandatoryHandoffReason({
        linkedPriority: "CRITICAL",
      }),
    ).toMatch(/vinculado é crítico/);
    expect(mandatoryHandoffReason({ draftPriority: "HIGH" })).toBeNull();
  });
});
