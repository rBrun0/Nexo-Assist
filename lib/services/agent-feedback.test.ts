import { beforeEach, describe, expect, it } from "@jest/globals";
import { MessageSender, Role } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    chatMessage: {
      findUnique: jest.fn(),
    },
    agentFeedback: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  AgentFeedbackError,
  submitAgentFeedback,
} from "@/lib/services/agent-feedback";

function resolveMock(mock: unknown, value: unknown) {
  (
    mock as { mockResolvedValue: (resolvedValue: unknown) => unknown }
  ).mockResolvedValue(value);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("submitAgentFeedback", () => {
  it("bloqueia funcionário que não é dono da conversa", async () => {
    resolveMock(prisma.chatMessage.findUnique, {
      id: "11111111-1111-4111-8111-111111111111",
      sender: MessageSender.ASSISTANT,
      thoughtProcess: { rationale: "ok" },
      chatSessionId: "22222222-2222-4222-8222-222222222222",
      chatSession: {
        id: "22222222-2222-4222-8222-222222222222",
        userId: "other-user",
      },
    });

    await expect(
      submitAgentFeedback({
        userId: "employee-1",
        role: Role.EMPLOYEE,
        messageId: "11111111-1111-4111-8111-111111111111",
      }),
    ).rejects.toBeInstanceOf(AgentFeedbackError);
  });

  it("permite analista e persiste o feedback", async () => {
    resolveMock(prisma.chatMessage.findUnique, {
      id: "11111111-1111-4111-8111-111111111111",
      sender: MessageSender.ASSISTANT,
      thoughtProcess: { rationale: "ok" },
      chatSessionId: "22222222-2222-4222-8222-222222222222",
      chatSession: {
        id: "22222222-2222-4222-8222-222222222222",
        userId: "employee-1",
      },
    });
    resolveMock(prisma.agentFeedback.create, {
      id: "feedback-1",
      createdAt: new Date("2026-11-13T12:00:00.000Z"),
    });

    const result = await submitAgentFeedback({
      userId: "analyst-1",
      role: Role.ANALYST,
      messageId: "11111111-1111-4111-8111-111111111111",
      note: "Prioridade errada",
    });

    expect(prisma.agentFeedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          note: "Prioridade errada",
          userId: "analyst-1",
        }),
      }),
    );
    expect(result.id).toBe("feedback-1");
  });
});
