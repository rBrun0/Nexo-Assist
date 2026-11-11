import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

export type ConversationFilter = "all" | "for_you" | "agent" | "mine";

type FilterPredicate = (
  conversation: AnalystConversationListItem,
  currentAnalystId: string,
) => boolean;

export const CONVERSATION_FILTERS: Record<ConversationFilter, FilterPredicate> =
  {
    all: () => true,
    for_you: (conversation, currentAnalystId) =>
      conversation.status === "Aguardando" ||
      (conversation.status === "Em atendimento" &&
        conversation.assignedAnalystId === currentAnalystId),
    agent: (conversation) => conversation.status === "Com o agente",
    mine: (conversation, currentAnalystId) =>
      conversation.status === "Em atendimento" &&
      conversation.assignedAnalystId === currentAnalystId,
  };

export function filterAnalystConversations({
  conversations,
  search,
  conversationFilter,
  currentAnalystId,
}: {
  conversations: AnalystConversationListItem[];
  search: string;
  conversationFilter: ConversationFilter;
  currentAnalystId: string;
}) {
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const matchesFilter = CONVERSATION_FILTERS[conversationFilter];

  return conversations.filter((conversation) => {
    if (conversation.status === "Encerrada") return false;

    const matchesSearch =
      !query ||
      `${conversation.name} ${conversation.job ?? ""} ${conversation.department} ${conversation.preview}`
        .toLocaleLowerCase("pt-BR")
        .includes(query);

    return matchesSearch && matchesFilter(conversation, currentAnalystId);
  });
}
