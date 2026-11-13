import { describe, expect, it } from "@jest/globals";

import { acceptsDemoPassword, isDemoAccountEmail } from "./demo-accounts";

describe("contas de demonstração", () => {
  it("reconhece os e-mails do seed", () => {
    expect(isDemoAccountEmail("Carlos.Silva@nexo.com.br")).toBe(true);
    expect(isDemoAccountEmail("pessoa@nexo.com.br")).toBe(false);
  });

  it("aceita qualquer senha não vazia fora de produção", () => {
    expect(
      acceptsDemoPassword("ana.souza@nexo.com.br", "qualquer", "development"),
    ).toBe(true);
    expect(acceptsDemoPassword("ana.souza@nexo.com.br", "   ", "development")).toBe(
      false,
    );
  });

  it("exige a senha real em produção", () => {
    expect(
      acceptsDemoPassword("ana.souza@nexo.com.br", "qualquer", "production"),
    ).toBe(false);
  });
});
