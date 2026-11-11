"use client";

import { NexoMark } from "@/components/brand/nexo-mark";
import { OnlinePresenceIndicator } from "@/components/chat/online-presence-indicator";
import type { OnlinePresenceUser } from "@/hooks/use-online-presence";

type ConversationStatus =
  | "BOT_ACTIVE"
  | "WAITING_HUMAN"
  | "HUMAN_ACTIVE"
  | "CLOSED";

function statusLabel(status: ConversationStatus | undefined) {
  if (status === "BOT_ACTIVE") return "Assistente online";
  if (status === "WAITING_HUMAN") return "Aguardando analista";
  if (status === "HUMAN_ACTIVE") return "Em atendimento humano";
  return "Carregando atendimento";
}

export function EmployeeChatHeader({
  status,
  onlineUsers,
  showPresence,
}: {
  status?: ConversationStatus;
  onlineUsers: OnlinePresenceUser[];
  showPresence: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 py-5">
      <NexoMark size={40} className="size-10" />
      <div>
        <p className="text-sm font-semibold text-slate-800">Nexo Assist</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${
              status === "BOT_ACTIVE"
                ? "bg-status-positive"
                : "bg-status-warning"
            }`}
          />
          <span className="text-[11px] text-slate-500">{statusLabel(status)}</span>
          {showPresence ? (
            <OnlinePresenceIndicator onlineUsers={onlineUsers} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
