"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  subscribeConversationPresence,
  type ConversationPresenceUser,
  type PresenceRole,
} from "@/lib/supabase/presence";

export type { PresenceRole };
export type OnlinePresenceUser = ConversationPresenceUser;

const TYPING_IDLE_MS = 1800;

export function useOnlinePresence({
  sessionId,
  user,
}: {
  sessionId: string | null;
  user: OnlinePresenceUser;
}) {
  const [onlineUsers, setOnlineUsers] = useState<OnlinePresenceUser[]>([]);
  const setTypingRef = useRef<(typing: boolean) => void>(() => undefined);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setOnlineUsers([]);
      setTypingRef.current = () => undefined;
      return;
    }

    const subscription = subscribeConversationPresence({
      sessionId,
      user,
      onSync: setOnlineUsers,
    });
    setTypingRef.current = subscription.setTyping;

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      subscription.setTyping(false);
      subscription.unsubscribe();
      setTypingRef.current = () => undefined;
    };
  }, [sessionId, user.id, user.name, user.role]);

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const notifyTyping = useCallback(() => {
    setTypingRef.current(true);
    clearTypingTimer();
    typingTimerRef.current = setTimeout(() => {
      setTypingRef.current(false);
      typingTimerRef.current = null;
    }, TYPING_IDLE_MS);
  }, [clearTypingTimer]);

  const stopTyping = useCallback(() => {
    clearTypingTimer();
    setTypingRef.current(false);
  }, [clearTypingTimer]);

  const isOnline = onlineUsers.some((entry) => entry.id === user.id);

  const peerIsTyping = useMemo(() => {
    const opposite: PresenceRole =
      user.role === "EMPLOYEE" ? "ANALYST" : "EMPLOYEE";
    return onlineUsers.some(
      (entry) =>
        entry.role === opposite &&
        entry.id !== user.id &&
        entry.typing === true,
    );
  }, [onlineUsers, user.id, user.role]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isOnline,
    peerIsTyping,
    notifyTyping,
    stopTyping,
  };
}
