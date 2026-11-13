import { beforeEach, describe, expect, it } from "@jest/globals";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/services/tickets", () => ({
  findCompatibleTicket: jest.fn(),
  createTicketForUserWithRetry: jest.fn(),
}));
jest.mock("@/lib/services/conversations", () => ({
  markSessionWaitingHuman: jest.fn(),
}));

import { markSessionWaitingHuman } from "@/lib/services/conversations";
import {
  createTicketForUserWithRetry,
  findCompatibleTicket,
} from "@/lib/services/tickets";
import {
  confirmationGate,
  persistPreparedTicket,
  prepareOpenTicket,
} from "@/lib/mastra/workflows/open-ticket-logic";

const findCompatible = findCompatibleTicket as unknown as {
  mockResolvedValue: (value: unknown) => unknown;
};
const createTicket = createTicketForUserWithRetry as unknown as {
  mockResolvedValue: (value: unknown) => unknown;
  mockRejectedValueOnce: (value: unknown) => unknown;
  mock: { calls: unknown[][] };
};
const markWaiting = markSessionWaitingHuman as unknown as {
  mock: { calls: unknown[][] };
};

const input = {
  userId: "11111111-1111-4111-8111-111111111111",
  conversationId: "22222222-2222-4222-8222-222222222222",
  title: "VPN da equipe caiu",
  description: "Ninguém da equipe consegue conectar na VPN.",
  type: "INCIDENT" as const,
  category: "NETWORK_VPN" as const,
  priority: "HIGH" as const,
  impact: "team" as const,
};

describe("passos do workflow de abertura", () => {
  beforeEach(() => {
    findCompatible.mockResolvedValue({ match: "none" });
    createTicket.mockResolvedValue({
      outcome: "created",
      ticket: {
        id: "33333333-3333-4333-8333-333333333333",
        code: "INC-1",
        priority: "CRITICAL",
      },
    });
  });

  it("prepara o rascunho crítico e suspende sem gravar", async () => {
    const prepared = await prepareOpenTicket(input);

    expect(confirmationGate()).toBe("suspend");
    expect(prepared.draft.priority).toBe("CRITICAL");
    expect(prepared.draft.affectedUserIds).toEqual([input.userId]);
    expect(prepared.duplicate.match).toBe("none");
    expect(createTicketForUserWithRetry).not.toHaveBeenCalled();
  });

  it("persiste uma vez só depois da confirmação", async () => {
    const prepared = await prepareOpenTicket(input);
    expect(confirmationGate({ confirmed: true })).toBe("persist");

    const result = await persistPreparedTicket(prepared);

    expect(result.outcome).toBe("created");
    expect(createTicket.mock.calls).toHaveLength(1);
    expect(createTicket.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        confirmed: true,
        priority: "CRITICAL",
        affectedUserIds: [input.userId],
      }),
    );
  });

  it("não grava quando a confirmação é recusada e marca handoff se a gravação falha", async () => {
    expect(confirmationGate({ confirmed: false })).toBe("cancel");
    const prepared = await prepareOpenTicket(input);
    createTicket.mockRejectedValueOnce({ code: "P1001" });

    await expect(persistPreparedTicket(prepared)).rejects.toEqual({
      code: "P1001",
    });
    expect(markWaiting.mock.calls[0]).toEqual([
      input.conversationId,
      input.userId,
      expect.stringContaining("Não foi possível gravar o chamado"),
    ]);
  });
});
