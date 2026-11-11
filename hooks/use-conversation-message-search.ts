"use client";

import { useEffect, useRef, useState } from "react";

export function useConversationMessageSearch(conversationId: string | null) {
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [searchState, setSearchState] = useState({
    conversationId,
    open: false,
    query: "",
  });

  if (searchState.conversationId !== conversationId) {
    setSearchState({ conversationId, open: false, query: "" });
  }

  const isSearchOpen = searchState.open;
  const messageQuery = searchState.query;

  useEffect(() => {
    if (!isSearchOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target || !searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(target)) {
        setSearchState((current) => ({
          ...current,
          open: false,
          query: "",
        }));
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchState((current) => ({
          ...current,
          open: false,
          query: "",
        }));
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  return {
    searchContainerRef,
    isSearchOpen,
    messageQuery,
    toggleSearch: () => {
      setSearchState((current) => ({
        conversationId,
        open: !current.open,
        query: current.open ? "" : current.query,
      }));
    },
    setQuery: (query: string) => {
      setSearchState((current) => ({
        ...current,
        conversationId,
        query,
      }));
    },
  };
}
