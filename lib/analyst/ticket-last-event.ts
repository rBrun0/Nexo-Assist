import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CircleCheck,
  CircleDot,
  CirclePause,
  Headset,
  Lock,
} from "lucide-react";

export type TicketStatusKey =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_ANALYST"
  | "APPROVED"
  | "RESOLVED"
  | "CLOSED"
  | string;

export function normalizeTicketStatusKey(
  status: string | null | undefined
): TicketStatusKey {
  return (status?.trim().toUpperCase() || "OPEN") as TicketStatusKey;
}

export function getTicketLastEvent(statusKey: TicketStatusKey): {
  label: string;
  icon: LucideIcon;
} {
  switch (normalizeTicketStatusKey(statusKey)) {
    case "WAITING_ANALYST":
      return { label: "Transferido para analista", icon: Headset };
    case "IN_PROGRESS":
      return { label: "Em andamento pelo time", icon: CircleDot };
    case "APPROVED":
      return { label: "Aprovado", icon: BadgeCheck };
    case "RESOLVED":
      return { label: "Resolvido", icon: CircleCheck };
    case "CLOSED":
      return { label: "Encerrado", icon: Lock };
    case "OPEN":
    default:
      return { label: "Chamado aberto", icon: CirclePause };
  }
}
