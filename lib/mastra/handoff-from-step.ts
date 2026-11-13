import type { ToolAction } from "@/lib/agent/tools";
import { mandatoryHandoffReason } from "@/lib/agent/handoff-policy";

export function handoffReasonForTurn(input: {
  employeeMessage?: string;
  actions: ToolAction[];
  linkedPriority?: string | null;
  linkedOverdue?: boolean;
}) {
  const requested = input.actions.find(
    (action) => action.name === "request_helpdesk_analyst",
  );
  if (requested?.summary) return requested.summary;

  const draftPriority = input.actions.find(
    (action) => action.name === "create_ticket",
  )?.draft?.priority;

  return mandatoryHandoffReason({
    employeeMessage: input.employeeMessage,
    draftPriority,
    linkedPriority: input.linkedPriority,
    linkedOverdue: input.linkedOverdue,
  });
}
