"use client";

import type { OnlinePresenceUser } from "@/hooks/use-online-presence";

export function OnlinePresenceIndicator({
  onlineUsers,
}: {
  onlineUsers: OnlinePresenceUser[];
}) {
  const onlineCount = onlineUsers.length;
  if (onlineCount === 0) {
    return null;
  }

  const label =
    onlineCount === 1 ? "1 pessoa ativa" : `${onlineCount} pessoas ativas`;
  const names = onlineUsers
    .map(
      (user) =>
        `${user.name} (${user.role === "ANALYST" ? "analista" : "funcionário"})`
    )
    .join(", ");

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800"
      title={names}
      aria-label={`${label} na conversa`}
      role="status"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}
