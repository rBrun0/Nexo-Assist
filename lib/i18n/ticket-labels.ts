import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_SHORT_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
} from "@/lib/constants";

export {
  PRIORITY_SHORT_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/constants";

function lookupLabel(
  map: Record<string, string>,
  value: string | null | undefined
) {
  if (!value) return "";
  const key = value.trim().toUpperCase();
  return map[key] ?? map[value] ?? value;
}

export function formatTicketTypeLabel(value: string | null | undefined) {
  return lookupLabel(TICKET_TYPE_LABELS, value);
}

export function formatTicketCategoryLabel(value: string | null | undefined) {
  return lookupLabel(CATEGORY_LABELS, value);
}

export function formatTicketPriorityLabel(
  value: string | null | undefined,
  { withSla = false }: { withSla?: boolean } = {}
) {
  if (withSla) return lookupLabel(PRIORITY_LABELS, value);
  return lookupLabel(PRIORITY_SHORT_LABELS, value);
}

export function formatTicketStatusLabel(value: string | null | undefined) {
  return lookupLabel(TICKET_STATUS_LABELS, value);
}

export type TicketStatusTone = "primary" | "warning" | "success";

/** Tom semântico do status para bolinhas/textos (tokens CSS). */
export function getTicketStatusTone(
  status: string | null | undefined,
): TicketStatusTone {
  const key = status?.trim().toUpperCase() ?? "";
  if (
    key === "RESOLVED" ||
    key === "CLOSED" ||
    key === "APPROVED"
  ) {
    return "success";
  }
  if (key === "WAITING_ANALYST") {
    return "warning";
  }
  return "primary";
}

export function getTicketStatusToneClasses(tone: TicketStatusTone) {
  switch (tone) {
    case "success":
      return {
        dot: "bg-success",
        text: "text-success",
      };
    case "warning":
      return {
        dot: "bg-warning",
        text: "text-warning-text",
      };
    case "primary":
      return {
        dot: "bg-primary",
        text: "text-primary",
      };
  }
}

export function formatTicketEnumLabel(
  kind: "type" | "category" | "priority" | "status",
  value: string | null | undefined
) {
  switch (kind) {
    case "type":
      return formatTicketTypeLabel(value);
    case "category":
      return formatTicketCategoryLabel(value);
    case "priority":
      return formatTicketPriorityLabel(value);
    case "status":
      return formatTicketStatusLabel(value);
  }
}
