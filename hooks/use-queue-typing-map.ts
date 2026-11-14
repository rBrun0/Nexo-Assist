"use client";

import { useEffect, useMemo, useState } from "react";

import { observeConversationPresence } from "@/lib/supabase/presence";

/** Observa typing do funcionário nas sessões da fila do analista. */
export function useQueueTypingMap(
  sessionIds: string[],
  excludeSessionId?: string | null,
) {
  const [typingBySessionId, setTypingBySessionId] = useState<
    Record<string, boolean>
  >({});

  const idsKey = useMemo(
    () =>
      [...new Set(sessionIds.filter(Boolean))]
        .filter((id) => id !== excludeSessionId)
        .sort()
        .join("|"),
    [sessionIds, excludeSessionId],
  );

  useEffect(() => {
    const ids = idsKey ? idsKey.split("|") : [];
    if (ids.length === 0) {
      setTypingBySessionId({});
      return;
    }

    const unsubscribers = ids.map((sessionId) =>
      observeConversationPresence({
        sessionId,
        onSync: (users) => {
          const typing = users.some(
            (user) => user.role === "EMPLOYEE" && user.typing === true,
          );
          setTypingBySessionId((current) => {
            if (current[sessionId] === typing) return current;
            return { ...current, [sessionId]: typing };
          });
        },
      }),
    );

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [idsKey]);

  return typingBySessionId;
}
