import { describe, expect, it } from "@jest/globals";

import { getChatEventDividerKind } from "./event-divider-icon";

describe("getChatEventDividerKind", () => {
  it("classifica transferência", () => {
    expect(getChatEventDividerKind("Transferida para suporte N2")).toBe(
      "transfer",
    );
    expect(getChatEventDividerKind("Transferido para N1")).toBe("transfer");
  });

  it("classifica assunção por analista", () => {
    expect(
      getChatEventDividerKind("Rafael Lima assumiu — agent pausado"),
    ).toBe("claim");
  });

  it("classifica devolução ao agente", () => {
    expect(getChatEventDividerKind("Devolvida ao Nexo Assist")).toBe(
      "return_to_bot",
    );
  });

  it("classifica encerramento", () => {
    expect(getChatEventDividerKind("Conversa encerrada")).toBe("closed");
  });

  it("retorna null sem palavras-chave", () => {
    expect(getChatEventDividerKind("Atualização interna")).toBeNull();
    expect(getChatEventDividerKind("   ")).toBeNull();
  });
});
