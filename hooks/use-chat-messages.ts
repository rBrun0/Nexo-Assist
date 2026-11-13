"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getChatHistoryAction } from "@/app/actions/chat";
import type { ChatHistoryMessage } from "@/lib/types/conversation";

export type { ChatHistoryMessage };

export const chatMessagesQueryKey = (sessionId: string) =>
  ["chat-messages", sessionId] as const;

const POLL_INTERVAL_MS = 15_000;

export function buildOptimisticEmployeeMessage({
  sessionId,
  employee,
  content,
}: {
  sessionId: string;
  employee: { id: string; name: string };
  content: string;
}): ChatHistoryMessage {
  return {
    id: `optimistic-${Date.now()}`,
    chatSessionId: sessionId,
    sender: "EMPLOYEE",
    senderUserId: employee.id,
    senderUser: {
      id: employee.id,
      name: employee.name,
      role: "EMPLOYEE",
      job: null,
    },
    content,
    thoughtProcess: null,
    metadata: null,
    readAtByEmployee: new Date().toISOString(),
    readAtByAnalyst: null,
    createdAt: new Date().toISOString(),
  };
}

export function useChatMessages(
  sessionId: string | null,
  initialMessages: ChatHistoryMessage[] = [],
  {
    pausePolling = false,
  }: {
    pausePolling?: boolean;
  } = {},
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: sessionId
      ? chatMessagesQueryKey(sessionId)
      : ["chat-messages", "none"],
    enabled: Boolean(sessionId),
    initialData:
      sessionId && initialMessages.length > 0 ? initialMessages : undefined,
    refetchInterval: sessionId && !pausePolling ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      if (!sessionId) return [];
      const result = await getChatHistoryAction(sessionId);
      if (!result.success) throw new Error(result.error);
      return result.messages as ChatHistoryMessage[];
    },
  });

  useEffect(() => {
    if (!sessionId) return;

    const refetchAuthorized = () => {
      if (document.visibilityState !== "visible") return;
      void queryClient.invalidateQueries({
        queryKey: chatMessagesQueryKey(sessionId),
      });
    };

    document.addEventListener("visibilitychange", refetchAuthorized);
    window.addEventListener("focus", refetchAuthorized);

    return () => {
      document.removeEventListener("visibilitychange", refetchAuthorized);
      window.removeEventListener("focus", refetchAuthorized);
    };
  }, [queryClient, sessionId]);

  const syncMessages = useCallback(
    (messages: ChatHistoryMessage[], forSessionId?: string) => {
      const targetSessionId = forSessionId ?? sessionId;
      if (!targetSessionId) return;
      queryClient.setQueryData(
        chatMessagesQueryKey(targetSessionId),
        messages,
      );
    },
    [queryClient, sessionId],
  );

  const appendOptimistic = useCallback(
    (message: ChatHistoryMessage, forSessionId?: string) => {
      const targetSessionId = forSessionId ?? sessionId;
      if (!targetSessionId) return;
      queryClient.setQueryData<ChatHistoryMessage[]>(
        chatMessagesQueryKey(targetSessionId),
        (current: ChatHistoryMessage[] | undefined) => [
          ...(current ?? []),
          message,
        ],
      );
    },
    [queryClient, sessionId],
  );

  const removeOptimistic = useCallback(
    (optimisticId: string, forSessionId?: string) => {
      const targetSessionId = forSessionId ?? sessionId;
      if (!targetSessionId) return;
      queryClient.setQueryData<ChatHistoryMessage[]>(
        chatMessagesQueryKey(targetSessionId),
        (current: ChatHistoryMessage[] | undefined) =>
          (current ?? []).filter(
            (item: ChatHistoryMessage) => item.id !== optimisticId,
          ),
      );
    },
    [queryClient, sessionId],
  );

  const replaceOptimistic = useCallback(
    (
      optimisticId: string,
      message: ChatHistoryMessage,
      forSessionId?: string,
    ) => {
      const targetSessionId = forSessionId ?? sessionId;
      if (!targetSessionId) return;
      queryClient.setQueryData<ChatHistoryMessage[]>(
        chatMessagesQueryKey(targetSessionId),
        (current: ChatHistoryMessage[] | undefined) => {
          const list = current ?? [];
          const index = list.findIndex(
            (item: ChatHistoryMessage) => item.id === optimisticId,
          );
          if (index === -1) return [...list, message];
          const next = [...list];
          next[index] = message;
          return next;
        },
      );
    },
    [queryClient, sessionId],
  );

  return {
    ...query,
    syncMessages,
    appendOptimistic,
    replaceOptimistic,
    removeOptimistic,
  };
}

export function useAnalystQueueRealtime(onUpdate: () => void) {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        onUpdate();
      }
    };

    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [onUpdate]);
}
