"use client";

import { AssistantTextBubble } from "@/components/chat/assistant-text-bubble";
import { TicketDraftCard } from "@/components/chat/ticket-draft-card";
import type { TicketDraftPresentation } from "@/lib/validations/ticket";

export function TicketDraftTurn({
  content,
  createdAt,
  draft,
  confirmed = false,
  cancelled = false,
  disabled = false,
  onConfirm,
  onEdit,
  onCancel,
}: {
  content: string;
  createdAt: string;
  draft: TicketDraftPresentation | Record<string, unknown>;
  confirmed?: boolean;
  cancelled?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <AssistantTextBubble content={content} createdAt={createdAt} />
      <TicketDraftCard
        draft={draft}
        confirmed={confirmed}
        cancelled={cancelled}
        disabled={disabled}
        onConfirm={onConfirm}
        onEdit={onEdit}
        onCancel={onCancel}
      />
    </div>
  );
}
