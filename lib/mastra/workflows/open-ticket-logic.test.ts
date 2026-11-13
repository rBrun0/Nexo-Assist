jest.mock("server-only", () => ({}));
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import { describe, expect, it } from "@jest/globals";

import { normalizeOpenTicketDraft } from "@/lib/mastra/workflows/open-ticket-logic";
import { isTransientDatabaseError } from "@/lib/services/tickets";

describe("abertura de chamado", () => {
  it("força o usuário da sessão e sobe equipe para crítico", () => {
    const draft = normalizeOpenTicketDraft({
      userId: "11111111-1111-4111-8111-111111111111",
      title: "VPN da equipe caiu",
      description: "Ninguém da equipe consegue conectar na VPN.",
      type: "INCIDENT",
      category: "NETWORK_VPN",
      priority: "HIGH",
      impact: "team",
    });

    expect(draft.affectedUserIds).toEqual([
      "11111111-1111-4111-8111-111111111111",
    ]);
    expect(draft.priority).toBe("CRITICAL");
    expect(draft.slaDeadlineIso).toEqual(expect.any(String));
  });

  it("só trata como transitório os erros de conexão do banco", () => {
    expect(isTransientDatabaseError({ code: "P1001" })).toBe(true);
    expect(isTransientDatabaseError(new Error("validação"))).toBe(false);
  });
});
