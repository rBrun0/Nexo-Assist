"use client";

import { useEffect, useState } from "react";

import { observeAnalystPresence } from "@/lib/supabase/presence";

/** Contagem live de analistas com a aba do console aberta (lobby Presence). */
export function useOnlineAnalystsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    return observeAnalystPresence({
      onSync: (users) => {
        setCount(users.filter((user) => user.role === "ANALYST").length);
      },
    });
  }, []);

  return count;
}
