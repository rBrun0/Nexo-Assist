"use client";

import { useEffect, useState } from "react";

import {
  subscribeConversationPresence,
  type ConversationPresenceUser,
  type PresenceRole,
} from "@/lib/supabase/presence";

export type { PresenceRole };
export type OnlinePresenceUser = ConversationPresenceUser;

export function useOnlinePresence({
  sessionId,
  user,
}: {
  sessionId: string | null;
  user: OnlinePresenceUser;
}) {
  const [onlineUsers, setOnlineUsers] = useState<OnlinePresenceUser[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setOnlineUsers([]);
      return;
    }

    return subscribeConversationPresence({
      sessionId,
      user,
      onSync: setOnlineUsers,
    });
  }, [sessionId, user.id, user.name, user.role]);

  const isOnline = onlineUsers.some((entry) => entry.id === user.id);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isOnline,
  };
}
