"use client";

import { AnalystTicketsPanel } from "@/components/analyst/analyst-tickets-panel";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

export function AnalystTicketsAside({
  conversation,
  currentAnalystId,
  onTicketStatusChange,
}: {
  conversation: AnalystConversationListItem;
  currentAnalystId?: string;
  onTicketStatusChange?: (ticketId: string, status: string) => Promise<void>;
}) {
  return (
    <aside className="hidden min-h-0 w-[330px] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white xl:flex">
      <AnalystTicketsPanel
        conversation={conversation}
        currentAnalystId={currentAnalystId}
        onTicketStatusChange={onTicketStatusChange}
      />
    </aside>
  );
}
