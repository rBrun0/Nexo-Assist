"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { sendManualChatMessageAction } from "@/app/actions/chat";
import {
  filterAnalystConversations,
  type ConversationFilter,
} from "@/lib/analyst/conversation-filters";
import {
  mapConversation,
  mapHistoryMessage,
  type AnalystConversationListItem,
} from "@/lib/analyst/map-conversation";
import {
  getAnalystConversation,
  listAnalystConversations,
  postAnalystConversationAction,
  type AnalystConversationLifecycleAction,
} from "@/lib/api/analyst";
import { updateTicketStatus } from "@/lib/api/tickets";
import type { AnalystConversationView } from "@/lib/types/conversation";
import {
  useAnalystQueueRealtime,
  useChatMessages,
} from "@/hooks/use-chat-messages";
import { useAnalystLobbyPresence } from "@/hooks/use-analyst-lobby-presence";
import { useOnlinePresence } from "@/hooks/use-online-presence";
import { useQueueTypingMap } from "@/hooks/use-queue-typing-map";

export type AnalystWorkingAction =
  | AnalystConversationLifecycleAction
  | "send_message"
  | null;

type ConversationAction = NonNullable<AnalystWorkingAction>;

export function useAnalystConsole({
  initialConversations,
  currentAnalystId,
  currentAnalystName,
}: {
  initialConversations: AnalystConversationView[];
  currentAnalystId: string;
  currentAnalystName: string;
}) {
  const [conversations, setConversations] = useState(
    initialConversations.map(mapConversation),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [conversationError, setConversationError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [workingAction, setWorkingAction] =
    useState<AnalystWorkingAction>(null);
  const [conversationFilter, setConversationFilter] =
    useState<ConversationFilter>("all");
  const [now, setNow] = useState(() => Date.now());
  const [openChatUnseen, setOpenChatUnseen] = useState(0);

  useAnalystLobbyPresence({
    analystId: currentAnalystId,
    analystName: currentAnalystName,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshQueue = useCallback(async () => {
    const next = (await listAnalystConversations()).map(mapConversation);
    setConversations((current) => {
      const retained = current.find(
        (conversation) =>
          conversation.id === selectedId &&
          conversation.status === "Encerrada",
      );
      if (
        retained &&
        !next.some((conversation) => conversation.id === retained.id)
      ) {
        return [...next, retained];
      }
      return next;
    });
    setConversationError("");
  }, [selectedId]);

  useAnalystQueueRealtime(
    useCallback(() => {
      void refreshQueue().catch((error: unknown) => {
        console.error("Falha ao atualizar fila de conversas:", error);
        setConversationError("Não foi possível atualizar a fila.");
      });
    }, [refreshQueue]),
  );

  const conversationsForQueue = useMemo(
    () =>
      conversations.map((conversation) =>
        conversation.id === selectedId && openChatUnseen > 0
          ? {
              ...conversation,
              unread: Math.max(conversation.unread, openChatUnseen),
            }
          : conversation,
      ),
    [conversations, openChatUnseen, selectedId],
  );

  const filteredConversations = useMemo(
    () =>
      filterAnalystConversations({
        conversations: conversationsForQueue,
        search,
        conversationFilter,
        currentAnalystId,
      }),
    [conversationsForQueue, conversationFilter, currentAnalystId, search],
  );

  const selectConversation = useCallback(async (conversationId: string) => {
    setSelectedId(conversationId);
    setOpenChatUnseen(0);
    setConversationError("");
    try {
      const conversation = mapConversation(
        await getAnalystConversation(conversationId),
      );
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversationId),
      ]);
    } catch (error) {
      console.error("Falha ao abrir conversa para o analista:", error);
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a conversa.",
      );
    }
  }, []);

  const selectedHistory = useChatMessages(selectedId, [], {
    pausePolling: isWorking,
  });
  const selectedConversationRecord =
    conversations.find((conversation) => conversation.id === selectedId) ??
    null;
  const selectedConversation = selectedConversationRecord
    ? {
        ...selectedConversationRecord,
        messages:
          selectedHistory.data?.map(mapHistoryMessage) ??
          selectedConversationRecord.messages,
      }
    : null;

  const presence = useOnlinePresence({
    sessionId:
      selectedConversation && selectedConversation.status !== "Encerrada"
        ? selectedConversation.id
        : null,
    user: {
      id: currentAnalystId,
      name: currentAnalystName,
      role: "ANALYST",
    },
  });

  const typingSessionIds = useMemo(
    () => filteredConversations.map((conversation) => conversation.id),
    [filteredConversations],
  );
  const queueTypingBySessionId = useQueueTypingMap(
    typingSessionIds,
    selectedId,
  );
  const typingBySessionId = useMemo(() => {
    if (!selectedId || !presence.peerIsTyping) return queueTypingBySessionId;
    return { ...queueTypingBySessionId, [selectedId]: true };
  }, [queueTypingBySessionId, presence.peerIsTyping, selectedId]);

  const employeeIsOnline = Boolean(
    selectedConversation &&
      presence.onlineUsers.some(
        (user) =>
          user.role === "EMPLOYEE" &&
          user.id === selectedConversation.employeeUserId,
      ),
  );


  useEffect(() => {
    if (!isWorking) return;
    presence.stopTyping();
  }, [isWorking, presence.stopTyping]);

  const conversationActionHandlers: Record<
    ConversationAction,
    (conversation: AnalystConversationListItem, message?: string) => Promise<void>
  > = {
    send_message: async (conversation, message) => {
      const result = await sendManualChatMessageAction({
        sessionId: conversation.id,
        message: message ?? "",
      });
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    claim: async (conversation) => {
      await postAnalystConversationAction(conversation.id, "claim");
    },
    return_to_bot: async (conversation) => {
      await postAnalystConversationAction(conversation.id, "return_to_bot");
    },
    close: async (conversation) => {
      await postAnalystConversationAction(conversation.id, "close");
    },
  };

  async function performConversationAction(
    action: ConversationAction,
    message?: string,
  ) {
    if (!selectedConversation) return;
    setIsWorking(true);
    setWorkingAction(action);
    setConversationError("");

    try {
      await conversationActionHandlers[action](selectedConversation, message);
      if (action === "send_message") setDraft("");

      await refreshQueue();
      await selectConversation(selectedConversation.id);
      await selectedHistory.refetch();
    } catch (error) {
      console.error("Falha ao executar ação na conversa:", error);
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a conversa.",
      );
    } finally {
      setIsWorking(false);
      setWorkingAction(null);
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text || !selectedConversation || isWorking) return;
    void performConversationAction("send_message", text);
  }

  async function handleTicketStatusChange(ticketId: string, status: string) {
    if (!selectedConversation) return;
    try {
      await updateTicketStatus(ticketId, status);
      setConversationError("");
      await Promise.all([
        refreshQueue(),
        selectConversation(selectedConversation.id),
      ]);
    } catch (error) {
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o chamado.",
      );
      throw error;
    }
  }

  const waitingCount = conversationsForQueue.filter(
    (conversation) => conversation.status === "Aguardando",
  ).length;
  const conversationsWithUnread = conversationsForQueue.filter(
    (conversation) => conversation.unread > 0,
  ).length;

  return {
    conversations: conversationsForQueue,
    filteredConversations,
    setOpenChatUnseen,
    selectedId,
    selectedConversation,
    search,
    setSearch,
    draft,
    setDraft,
    conversationError,
    isWorking,
    workingAction,
    conversationFilter,
    setConversationFilter,
    now,
    employeeIsOnline,
    peerIsTyping: presence.peerIsTyping,
    notifyTyping: presence.notifyTyping,
    stopTyping: presence.stopTyping,
    typingBySessionId,
    waitingCount,
    conversationsWithUnread,
    selectConversation,
    clearSelection: () => {
      setSelectedId(null);
      setOpenChatUnseen(0);
    },
    performConversationAction,
    sendMessage,
    handleTicketStatusChange,
  };
}
