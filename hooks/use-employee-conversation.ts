"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { sendManualChatMessageAction } from "@/app/actions/chat";
import { buildTicketSelectionMessage } from "@/components/chat/assistant-message-blocks";
import {
  buildOptimisticEmployeeMessage,
  useChatMessages,
} from "@/hooks/use-chat-messages";
import { useOnlinePresence } from "@/hooks/use-online-presence";
import {
  applyAgentProgressEvent,
  type AgentActivityStep,
} from "@/lib/agent/activity";
import type { ServiceDeskUIMessage } from "@/lib/agent/run-service-desk-agent";
import {
  cancelTicketDraft,
  confirmTicketDraft as confirmTicketDraftRequest,
  getMyConversation,
  requestAnalyst,
} from "@/lib/api/conversations";
import { listMyTickets } from "@/lib/api/tickets";
import {
  getEmployeeStatusUi,
  isHumanHandoffStatus,
} from "@/lib/chat/conversation-status";
import { CLIENT_STREAM_TIMEOUT_MS } from "@/lib/chat/stream-timeout";
import type { ChatHistoryMessage } from "@/lib/types/conversation";
import type {
  EmployeeConversation,
  EmployeeTicket,
} from "@/lib/types/employee-conversation";
import { asOptionalTicketId } from "@/lib/validations/uuid";
import type {
  ChatOption,
  TicketChoiceIntent,
  TicketChoiceItem,
} from "@/lib/validations/chat-metadata";

type EmployeeIdentity = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export function useEmployeeConversation({
  employee,
  enabled,
}: {
  employee: EmployeeIdentity;
  enabled: boolean;
}) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<EmployeeConversation | null>(
    null,
  );
  const [, setTickets] = useState<EmployeeTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [conversationError, setConversationError] = useState("");
  const [agentActivitySteps, setAgentActivitySteps] = useState<
    AgentActivityStep[]
  >([]);
  const [isSendingManualMessage, setIsSendingManualMessage] = useState(false);
  const [isRequestingAnalyst, setIsRequestingAnalyst] = useState(false);
  const [pendingLocalMessage, setPendingLocalMessage] =
    useState<ChatHistoryMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optimisticMessageIdRef = useRef<string | null>(null);
  const conversationRef = useRef<EmployeeConversation | null>(null);
  const chatStatusRef = useRef<string>("ready");
  const streamedResponseTextRef = useRef("");
  const streamStartedAtRef = useRef<number | null>(null);
  const chatHistoryRefetchRef = useRef<(() => Promise<unknown>) | null>(null);
  const loadConversationRef = useRef<(() => Promise<void>) | null>(null);
  const removeOptimisticRef = useRef<
    ((optimisticId: string, forSessionId?: string) => void) | null
  >(null);
  const syncMessagesRef = useRef<
    ((messages: ChatHistoryMessage[], forSessionId?: string) => void) | null
  >(null);

  const clearStreamTimeout = useCallback(() => {
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
  }, []);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<ServiceDeskUIMessage>({
        api: "/api/conversations/me",
        prepareSendMessagesRequest: ({ body }) => {
          const requestBody =
            body && typeof body === "object"
              ? (body as Record<string, unknown>)
              : {};
          const nextMessage =
            typeof requestBody.message === "string"
              ? requestBody.message.trim()
              : "";
          const ticketId = asOptionalTicketId(
            typeof requestBody.selectedTicketId === "string"
              ? requestBody.selectedTicketId
              : undefined,
          );
          return {
            body: {
              message: nextMessage,
              ...(ticketId ? { selectedTicketId: ticketId } : {}),
            },
          };
        },
      }),
    [],
  );

  const {
    messages: streamedMessages,
    sendMessage: sendChatMessage,
    setMessages: setStreamedMessages,
    status: chatStatus,
    stop: stopChat,
  } = useChat<ServiceDeskUIMessage>({
    transport: chatTransport,
    onData: (dataPart) => {
      if (dataPart.type === "data-progress") {
        setAgentActivitySteps((current) =>
          applyAgentProgressEvent(current, dataPart.data),
        );
      }
    },
    onFinish: () => {
      clearStreamTimeout();
      streamStartedAtRef.current = null;
      setAgentActivitySteps([]);
      setStreamedMessages([]);
      void Promise.all([
        loadConversationRef.current?.() ?? Promise.resolve(),
        chatHistoryRefetchRef.current?.() ?? Promise.resolve(),
      ]).catch((error: unknown) => {
        console.error(
          "Falha ao carregar conversa após a resposta do agente:",
          {
            conversationId: conversationRef.current?.id ?? null,
            error,
          },
        );
        setConversationError(
          "A resposta chegou, mas não foi possível atualizar o histórico.",
        );
      });
    },
    onError: (error) => {
      clearStreamTimeout();
      const startedAt = streamStartedAtRef.current;
      console.error("Falha ao transmitir resposta do agente:", {
        message: error instanceof Error ? error.message : String(error),
        conversationId: conversationRef.current?.id ?? null,
        chatStatus: chatStatusRef.current,
        streamStartedAt: startedAt,
        hadStreamedText: Boolean(streamedResponseTextRef.current.trim()),
        error,
      });
      streamStartedAtRef.current = null;
      setAgentActivitySteps([]);
      setStreamedMessages([]);
      const optimisticId = optimisticMessageIdRef.current;
      if (optimisticId && conversationRef.current?.id) {
        removeOptimisticRef.current?.(
          optimisticId,
          conversationRef.current.id,
        );
      }
      optimisticMessageIdRef.current = null;
      setPendingLocalMessage(null);
      setConversationError(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Não foi possível gerar uma resposta agora. Tente novamente.",
      );
      void Promise.all([
        loadConversationRef.current?.() ?? Promise.resolve(),
        chatHistoryRefetchRef.current?.() ?? Promise.resolve(),
      ]).catch((loadError: unknown) => {
        console.error("Falha ao atualizar conversa após erro do agente:", {
          conversationId: conversationRef.current?.id ?? null,
          loadError,
        });
      });
    },
  });

  const chatHistory = useChatMessages(
    conversation?.id ?? null,
    conversation?.messages ?? [],
    {
      pausePolling: chatStatus === "submitted" || chatStatus === "streaming",
    },
  );

  const syncConversationMessages = useCallback(
    (nextConversation: EmployeeConversation | null) => {
      setConversation(nextConversation);
      if (nextConversation?.id) {
        syncMessagesRef.current?.(
          nextConversation.messages,
          nextConversation.id,
        );
      }
    },
    [],
  );

  const loadConversation = useCallback(async () => {
    const [nextConversation, nextTickets] = await Promise.all([
      getMyConversation(),
      listMyTickets(),
    ]);
    syncConversationMessages(nextConversation);
    setTickets(nextTickets);
    setIsLoadingConversation(false);
    optimisticMessageIdRef.current = null;
    setPendingLocalMessage(null);
  }, [syncConversationMessages]);

  useOnlinePresence({
    sessionId: enabled ? (conversation?.id ?? null) : null,
    user: {
      id: employee.id,
      name: employee.name,
      role: "EMPLOYEE",
    },
  });

  const messages = useMemo(() => {
    const base = chatHistory.data ?? conversation?.messages ?? [];
    if (!pendingLocalMessage) return base;
    if (base.some((item) => item.id === pendingLocalMessage.id)) return base;
    if (
      base.some(
        (item) =>
          item.sender === "EMPLOYEE" &&
          item.content === pendingLocalMessage.content,
      )
    ) {
      return base;
    }
    return [...base, pendingLocalMessage];
  }, [chatHistory.data, conversation?.messages, pendingLocalMessage]);

  const messageLimit = conversation?.messageLimit ?? 30;
  const messageCount =
    conversation?.messageCount ??
    messages.filter((item) => item.sender !== "SYSTEM").length;
  const isAtMessageLimit = messageCount >= messageLimit;
  const isSendingMessage =
    isSendingManualMessage ||
    chatStatus === "submitted" ||
    chatStatus === "streaming";
  const streamedResponseText = streamedMessages
    .filter((streamedMessage) => streamedMessage.role === "assistant")
    .flatMap((streamedMessage) => streamedMessage.parts)
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
  const statusBadge = getEmployeeStatusUi(conversation?.status);

  useEffect(() => {
    conversationRef.current = conversation;
    chatHistoryRefetchRef.current = chatHistory.refetch;
    removeOptimisticRef.current = chatHistory.removeOptimistic;
    syncMessagesRef.current = chatHistory.syncMessages;
    chatStatusRef.current = chatStatus;
    loadConversationRef.current = loadConversation;
    streamedResponseTextRef.current = streamedResponseText;
  }, [
    conversation,
    chatHistory.refetch,
    chatHistory.removeOptimistic,
    chatHistory.syncMessages,
    chatStatus,
    loadConversation,
    streamedResponseText,
  ]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async conversation bootstrap
    void loadConversation().catch((error: unknown) => {
      if (cancelled) return;
      console.error("Falha ao carregar conversa do funcionário:", error);
      setConversationError("Não foi possível atualizar a conversa.");
      setIsLoadingConversation(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, loadConversation]);

  useEffect(() => {
    if (!enabled) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    enabled,
    messages.length,
    streamedResponseText,
    agentActivitySteps.length,
    isSendingMessage,
  ]);

  useEffect(() => {
    return () => clearStreamTimeout();
  }, [clearStreamTimeout]);

  async function submitMessage(text: string, ticketIdOverride?: string) {
    const trimmedMessage = text.trim();
    if (!trimmedMessage || isSendingMessage || isAtMessageLimit) return;

    setConversationError("");
    setAgentActivitySteps([
      {
        id: "sending",
        label: "Enviando sua mensagem...",
        status: "running",
      },
    ]);
    const ticketId = asOptionalTicketId(ticketIdOverride ?? selectedTicketId);
    setMessage("");

    const sessionId = conversation?.id ?? null;
    const optimisticMessage = buildOptimisticEmployeeMessage({
      sessionId: sessionId ?? "pending",
      employee,
      content: trimmedMessage,
    });
    optimisticMessageIdRef.current = optimisticMessage.id;
    if (sessionId) {
      chatHistory.appendOptimistic(optimisticMessage, sessionId);
    } else {
      setPendingLocalMessage(optimisticMessage);
    }

    try {
      if (isHumanHandoffStatus(conversation?.status) && conversation) {
        setIsSendingManualMessage(true);
        const result = await sendManualChatMessageAction({
          sessionId: conversation.id,
          message: trimmedMessage,
        });
        if (!result.success) throw new Error(result.error);
        chatHistory.replaceOptimistic(
          optimisticMessage.id,
          result.message as ChatHistoryMessage,
          conversation.id,
        );
        optimisticMessageIdRef.current = null;
        setPendingLocalMessage(null);
        setSelectedTicketId("");
        setAgentActivitySteps([]);
        await Promise.all([chatHistory.refetch(), loadConversation()]);
        return;
      }

      clearStreamTimeout();
      streamStartedAtRef.current = Date.now();
      streamTimeoutRef.current = setTimeout(() => {
        void (async () => {
          const elapsedMs =
            streamStartedAtRef.current != null
              ? Date.now() - streamStartedAtRef.current
              : CLIENT_STREAM_TIMEOUT_MS;
          console.error("Timeout do stream no cliente:", {
            timeoutMs: CLIENT_STREAM_TIMEOUT_MS,
            elapsedMs,
            conversationId: conversationRef.current?.id ?? null,
            chatStatus: chatStatusRef.current,
            hadStreamedText: Boolean(streamedResponseTextRef.current.trim()),
            note: "Abort local do browser; o servidor pode ainda estar processando, em retry ou com cota Gemini esgotada.",
          });
          try {
            await stopChat();
          } catch (error) {
            console.error("Falha ao interromper stream travado:", {
              conversationId: conversationRef.current?.id ?? null,
              error,
            });
          }
          streamStartedAtRef.current = null;
          setAgentActivitySteps([]);
          setStreamedMessages([]);
          const optimisticId = optimisticMessageIdRef.current;
          if (optimisticId && conversationRef.current?.id) {
            chatHistory.removeOptimistic(
              optimisticId,
              conversationRef.current.id,
            );
          }
          optimisticMessageIdRef.current = null;
          setPendingLocalMessage(null);
          setConversationError(
            "A resposta demorou demais. Tente enviar novamente.",
          );
          void Promise.all([loadConversation(), chatHistory.refetch()]).catch(
            (loadError: unknown) => {
              console.error(
                "Falha ao atualizar conversa após timeout do stream:",
                {
                  conversationId: conversationRef.current?.id ?? null,
                  loadError,
                },
              );
            },
          );
        })();
      }, CLIENT_STREAM_TIMEOUT_MS);

      await sendChatMessage(
        { text: trimmedMessage },
        {
          body: {
            message: trimmedMessage,
            ...(ticketId ? { selectedTicketId: ticketId } : {}),
          },
        },
      );
      setSelectedTicketId("");
    } catch (error) {
      clearStreamTimeout();
      console.error("Falha ao enviar mensagem do funcionário:", {
        conversationId: sessionId,
        chatStatus: chatStatusRef.current,
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      streamStartedAtRef.current = null;
      setAgentActivitySteps([]);
      if (sessionId) {
        chatHistory.removeOptimistic(optimisticMessage.id, sessionId);
      }
      optimisticMessageIdRef.current = null;
      setPendingLocalMessage(null);
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setIsSendingManualMessage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(message);
  }

  function editTicketDraft() {
    setMessage("Quero alterar o rascunho: ");
  }

  async function confirmTicketDraft(draftMessageId: string) {
    setConversationError("");
    try {
      const nextConversation =
        await confirmTicketDraftRequest(draftMessageId);
      syncConversationMessages(nextConversation);
      await loadConversation();
    } catch (error) {
      console.error("Falha ao confirmar rascunho de chamado:", error);
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar o chamado.",
      );
    }
  }

  async function cancelTicketDraftAction(draftMessageId: string) {
    setConversationError("");
    try {
      const nextConversation = await cancelTicketDraft(draftMessageId);
      syncConversationMessages(nextConversation);
      await loadConversation();
    } catch (error) {
      console.error("Falha ao cancelar rascunho de chamado:", error);
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o rascunho.",
      );
    }
  }

  const lastInteractiveAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const item = messages[index];
      if (item.sender === "ASSISTANT") return item.id;
    }
    return null;
  }, [messages]);

  function handleOptionSelect(option: ChatOption) {
    const trimmed = option.message.trim();
    if (trimmed.endsWith(":")) {
      setMessage(trimmed + " ");
      return;
    }
    void submitMessage(trimmed);
  }

  function handleTicketSelect(
    ticket: TicketChoiceItem,
    intent: TicketChoiceIntent,
  ) {
    setSelectedTicketId(ticket.id);
    const selection = buildTicketSelectionMessage(ticket, intent);
    if (selection.mode === "compose") {
      setMessage(selection.text + " ");
      return;
    }
    void submitMessage(selection.text, ticket.id);
  }

  function handleArticleSelect(article: { title: string; category?: string }) {
    void submitMessage(`Me explique: ${article.title}`);
  }

  async function requestAnalystFromLimit() {
    if (isRequestingAnalyst || conversation?.status !== "BOT_ACTIVE") return;
    setIsRequestingAnalyst(true);
    setConversationError("");
    try {
      const nextConversation = await requestAnalyst(
        "Funcionário solicitou analista após atingir o limite de 30 mensagens.",
      );
      syncConversationMessages(nextConversation);
      await chatHistory.refetch();
    } catch (error) {
      console.error(
        "Falha ao solicitar analista no limite da conversa:",
        error,
      );
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar um analista.",
      );
    } finally {
      setIsRequestingAnalyst(false);
    }
  }

  return {
    message,
    setMessage,
    conversation,
    messages,
    messageCount,
    messageLimit,
    isAtMessageLimit,
    isLoadingConversation,
    conversationError,
    agentActivitySteps,
    isSendingMessage,
    isRequestingAnalyst,
    streamedResponseText,
    statusBadge,
    messagesEndRef,
    lastInteractiveAssistantMessageId,
    submitMessage,
    handleSubmit,
    editTicketDraft,
    confirmTicketDraft,
    cancelTicketDraftAction,
    handleOptionSelect,
    handleTicketSelect,
    handleArticleSelect,
    requestAnalystFromLimit,
  };
}
