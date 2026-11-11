import {
  activityStepsFromThoughtProcess,
  applyAgentProgressEvent,
} from "@/lib/agent/activity";

describe("applyAgentProgressEvent", () => {
  it("acumula running e conclui com done pelo mesmo id", () => {
    let steps = applyAgentProgressEvent([], {
      id: "list_my_tickets",
      message: "Consultando seus chamados...",
      status: "running",
    });
    expect(steps).toEqual([
      {
        id: "list_my_tickets",
        label: "Consultando seus chamados...",
        status: "running",
      },
    ]);

    steps = applyAgentProgressEvent(steps, {
      id: "list_my_tickets",
      message: "Consultou seus chamados (3)",
      status: "done",
    });
    expect(steps).toEqual([
      {
        id: "list_my_tickets",
        label: "Consultou seus chamados (3)",
        status: "done",
      },
    ]);
  });

  it("marca running anterior como done ao iniciar outro passo", () => {
    const steps = applyAgentProgressEvent(
      [
        {
          id: "analyze",
          label: "Analisando sua solicitação...",
          status: "running",
        },
      ],
      {
        id: "list_my_tickets",
        message: "Consultando seus chamados...",
        status: "running",
      }
    );

    expect(steps).toEqual([
      {
        id: "analyze",
        label: "Analisando sua solicitação...",
        status: "done",
      },
      {
        id: "list_my_tickets",
        label: "Consultando seus chamados...",
        status: "running",
      },
    ]);
  });
});

describe("activityStepsFromThoughtProcess", () => {
  it("extrai labels das actions", () => {
    expect(
      activityStepsFromThoughtProcess({
        actions: [{ name: "list_my_tickets", label: "Consultou o INC-1" }],
        confidence: "high",
      })
    ).toEqual([
      {
        id: "history-0-Consultou o INC-1",
        label: "Consultou o INC-1",
        status: "done",
      },
    ]);
  });
});
