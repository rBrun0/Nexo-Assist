"use client";

import { AnalystTicketsPanel } from "@/components/analyst/analyst-tickets-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AnalystConversationListItem } from "@/lib/analyst/map-conversation";

export function AnalystTicketsSheet({
  open,
  onOpenChange,
  conversation,
  currentAnalystId,
  onTicketStatusChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: AnalystConversationListItem;
  currentAnalystId: string;
  onTicketStatusChange?: (ticketId: string, status: string) => Promise<void>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-sm"
        showCloseButton
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Chamados do colaborador</SheetTitle>
          <SheetDescription>
            Detalhes dos chamados vinculados a esta conversa.
          </SheetDescription>
        </SheetHeader>
        <AnalystTicketsPanel
          conversation={conversation}
          currentAnalystId={currentAnalystId}
          onTicketStatusChange={onTicketStatusChange}
          className="h-full"
        />
      </SheetContent>
    </Sheet>
  );
}
