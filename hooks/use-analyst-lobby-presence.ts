"use client";

import { useEffect } from "react";

import { subscribeAnalystPresence } from "@/lib/supabase/presence";

/** Mantém o analista online no lobby enquanto a aba do console estiver montada. */
export function useAnalystLobbyPresence({
  analystId,
  analystName,
}: {
  analystId: string;
  analystName: string;
}) {
  useEffect(() => {
    return subscribeAnalystPresence({
      user: {
        id: analystId,
        name: analystName,
        role: "ANALYST",
      },
      onSync: () => undefined,
    });
  }, [analystId, analystName]);
}
