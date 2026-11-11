"use client";

import type { ReactNode } from "react";

import { ArticleRefsTurn } from "@/components/chat/turns/article-refs-turn";
import { ImpactChoiceTurn } from "@/components/chat/turns/impact-choice-turn";
import { PlainAssistantTurn } from "@/components/chat/turns/plain-assistant-turn";
import { SystemStatusTurn } from "@/components/chat/turns/system-status-turn";
import { TicketChoiceTurn } from "@/components/chat/turns/ticket-choice-turn";
import { TicketDraftTurn } from "@/components/chat/turns/ticket-draft-turn";
import { TicketStatusTurn } from "@/components/chat/turns/ticket-status-turn";
import {
  parseAssistantMessageMetadata,
  type AssistantMessageMetadata,
  type ChatOption,
  type TicketChoiceIntent,
  type TicketChoiceItem,
} from "@/lib/validations/chat-metadata";

type AssistantTurnKind =
  | "impact_choice"
  | "ticket_choice"
  | "ticket_draft"
  | "ticket_status"
  | "system_status"
  | "article_refs";

type TurnContext = {
  content: string;
  createdAt: string;
  controlsDisabled: boolean;
  onOptionSelect: (option: ChatOption) => void;
  onTicketSelect: (
    ticket: TicketChoiceItem,
    intent: TicketChoiceIntent,
  ) => void;
  onArticleSelect: (article: { title: string; category?: string }) => void;
  onConfirmDraft: () => void;
  onEditDraft: () => void;
  onCancelDraft: () => void;
};

function getMetadataOptions(
  parsed: AssistantMessageMetadata | null,
): ChatOption[] {
  if (!parsed || !("options" in parsed) || !Array.isArray(parsed.options)) {
    return [];
  }
  return parsed.options;
}

function isAssistantTurnKind(kind: unknown): kind is AssistantTurnKind {
  return (
    kind === "impact_choice" ||
    kind === "ticket_choice" ||
    kind === "ticket_draft" ||
    kind === "ticket_status" ||
    kind === "system_status" ||
    kind === "article_refs"
  );
}

const ASSISTANT_TURN_BY_KIND: {
  [K in AssistantTurnKind]: (
    metadata: Extract<AssistantMessageMetadata, { kind: K }>,
    ctx: TurnContext,
  ) => ReactNode;
} = {
  impact_choice: (metadata, ctx) => (
    <ImpactChoiceTurn
      question={metadata.question}
      options={metadata.options}
      createdAt={ctx.createdAt}
      disabled={ctx.controlsDisabled}
      onSelect={ctx.onOptionSelect}
    />
  ),
  ticket_choice: (metadata, ctx) => (
    <TicketChoiceTurn
      content={ctx.content}
      createdAt={ctx.createdAt}
      tickets={metadata.tickets}
      intent={metadata.intent}
      disabled={ctx.controlsDisabled}
      onSelect={ctx.onTicketSelect}
    />
  ),
  ticket_draft: (metadata, ctx) => {
    const confirmed = metadata.confirmed === true;
    const cancelled = metadata.cancelled === true;
    return (
      <TicketDraftTurn
        content={ctx.content}
        createdAt={ctx.createdAt}
        draft={metadata.draft}
        confirmed={confirmed}
        cancelled={cancelled}
        disabled={ctx.controlsDisabled || confirmed || cancelled}
        onConfirm={ctx.onConfirmDraft}
        onEdit={ctx.onEditDraft}
        onCancel={ctx.onCancelDraft}
      />
    );
  },
  ticket_status: (metadata, ctx) => (
    <TicketStatusTurn
      content={ctx.content}
      createdAt={ctx.createdAt}
      ticket={metadata.ticket}
      options={metadata.options ?? []}
      disabled={ctx.controlsDisabled}
      onOptionSelect={ctx.onOptionSelect}
    />
  ),
  system_status: (metadata, ctx) => (
    <SystemStatusTurn
      content={ctx.content}
      createdAt={ctx.createdAt}
      source={metadata.source}
      message={metadata.message}
      services={metadata.services}
      options={metadata.options ?? []}
      disabled={ctx.controlsDisabled}
      onOptionSelect={ctx.onOptionSelect}
    />
  ),
  article_refs: (metadata, ctx) => (
    <ArticleRefsTurn
      content={ctx.content}
      createdAt={ctx.createdAt}
      articles={metadata.articles}
      options={metadata.options ?? []}
      disabled={ctx.controlsDisabled}
      onArticleSelect={ctx.onArticleSelect}
      onOptionSelect={ctx.onOptionSelect}
    />
  ),
};

function renderAssistantTurn(
  parsed: AssistantMessageMetadata,
  ctx: TurnContext,
): ReactNode | null {
  if (!("kind" in parsed) || !isAssistantTurnKind(parsed.kind)) return null;

  // Switch em parsed.kind estreita a union; o mapa tipado concentra o JSX.
  switch (parsed.kind) {
    case "impact_choice":
      return ASSISTANT_TURN_BY_KIND.impact_choice(parsed, ctx);
    case "ticket_choice":
      return ASSISTANT_TURN_BY_KIND.ticket_choice(parsed, ctx);
    case "ticket_draft":
      return ASSISTANT_TURN_BY_KIND.ticket_draft(parsed, ctx);
    case "ticket_status":
      return ASSISTANT_TURN_BY_KIND.ticket_status(parsed, ctx);
    case "system_status":
      return ASSISTANT_TURN_BY_KIND.system_status(parsed, ctx);
    case "article_refs":
      return ASSISTANT_TURN_BY_KIND.article_refs(parsed, ctx);
  }
}

export function AssistantMessageBlocks({
  content,
  createdAt,
  metadata,
  interactive = false,
  disabled = false,
  onOptionSelect,
  onTicketSelect,
  onArticleSelect,
  onConfirmDraft,
  onEditDraft,
  onCancelDraft,
}: {
  content: string;
  createdAt: string;
  metadata: unknown;
  interactive?: boolean;
  disabled?: boolean;
  onOptionSelect: (option: ChatOption) => void;
  onTicketSelect: (
    ticket: TicketChoiceItem,
    intent: TicketChoiceIntent,
  ) => void;
  onArticleSelect: (article: { title: string; category?: string }) => void;
  onConfirmDraft: () => void;
  onEditDraft: () => void;
  onCancelDraft: () => void;
}) {
  const parsed = parseAssistantMessageMetadata(metadata);
  const controlsDisabled = disabled || !interactive;
  const options = getMetadataOptions(parsed);
  const ctx: TurnContext = {
    content,
    createdAt,
    controlsDisabled,
    onOptionSelect,
    onTicketSelect,
    onArticleSelect,
    onConfirmDraft,
    onEditDraft,
    onCancelDraft,
  };

  if (parsed) {
    const turn = renderAssistantTurn(parsed, ctx);
    if (turn) return turn;
  }

  return (
    <PlainAssistantTurn
      content={content}
      createdAt={createdAt}
      options={options}
      disabled={controlsDisabled}
      onOptionSelect={onOptionSelect}
    />
  );
}

export function buildTicketSelectionMessage(
  ticket: TicketChoiceItem,
  intent: TicketChoiceIntent,
) {
  if (intent === "add_info") {
    return {
      mode: "compose" as const,
      text: `Quero adicionar informação ao chamado ${ticket.code} — ${ticket.title}:`,
    };
  }

  return {
    mode: "send" as const,
    text: `Quero saber sobre o chamado ${ticket.code} — ${ticket.title}`,
  };
}
