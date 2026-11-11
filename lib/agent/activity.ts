export type AgentActivityStatus = "running" | "done" | "complete";

export type AgentActivityStep = {
  id: string;
  label: string;
  status: AgentActivityStatus;
};

export type AgentProgressPayload = {
  id?: string;
  message: string;
  label?: string;
  status?: AgentActivityStatus;
  phase?: "working" | "complete";
};

export function applyAgentProgressEvent(
  steps: AgentActivityStep[],
  payload: AgentProgressPayload
): AgentActivityStep[] {
  const label = (payload.label ?? payload.message).trim();
  if (!label) return steps;

  const status: AgentActivityStatus =
    payload.status ??
    (payload.phase === "complete" ? "complete" : "running");

  if (status === "complete") {
    return steps.map((step) =>
      step.status === "running" ? { ...step, status: "done" } : step
    );
  }

  const id = payload.id ?? `step-${steps.length + 1}-${label}`;

  if (status === "running") {
    const withoutRunning = steps.map((step) =>
      step.status === "running" ? { ...step, status: "done" as const } : step
    );
    return [...withoutRunning, { id, label, status: "running" }];
  }

  const byIdIndex = steps.findIndex((step) => step.id === id);
  if (byIdIndex >= 0) {
    return steps.map((step, index) =>
      index === byIdIndex ? { ...step, label, status: "done" } : step
    );
  }

  const runningIndex = steps.findIndex((step) => step.status === "running");
  if (runningIndex >= 0) {
    return steps.map((step, index) =>
      index === runningIndex
        ? { ...step, id, label, status: "done" }
        : step
    );
  }

  return [...steps, { id, label, status: "done" }];
}

export function activityStepsFromThoughtProcess(
  thoughtProcess: unknown
): AgentActivityStep[] {
  if (typeof thoughtProcess !== "object" || thoughtProcess === null) {
    return [];
  }

  const actions = (thoughtProcess as { actions?: unknown }).actions;
  if (!Array.isArray(actions)) return [];

  return actions.flatMap((action, index) => {
    if (typeof action !== "object" || action === null) return [];
    const label =
      typeof (action as { label?: unknown }).label === "string"
        ? (action as { label: string }).label.trim()
        : typeof (action as { name?: unknown }).name === "string"
          ? (action as { name: string }).name.trim()
          : "";
    if (!label) return [];
    return [
      {
        id: `history-${index}-${label}`,
        label,
        status: "done" as const,
      },
    ];
  });
}
