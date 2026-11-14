"use client";

import { AnalystChatPanel } from "@/components/analyst/analyst-chat-panel";
import { AnalystQueuePanel } from "@/components/analyst/analyst-queue-panel";
import { AnalystSidebar } from "@/components/analyst/analyst-sidebar";
import { AnalystTicketsAside } from "@/components/analyst/analyst-tickets-aside";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAnalystConsole } from "@/hooks/use-analyst-console";
import { useLogout } from "@/hooks/use-logout";
import type { AnalystConversationView } from "@/lib/types/conversation";

export function AnalystConsole({
  initialConversations,
  currentAnalystId,
  currentAnalystName,
}: {
  initialConversations: AnalystConversationView[];
  currentAnalystId: string;
  currentAnalystName: string;
}) {
  const { logout, logoutError, isLoggingOut } = useLogout();
  const consoleState = useAnalystConsole({
    initialConversations,
    currentAnalystId,
    currentAnalystName,
  });

  return (
    <SidebarProvider defaultOpen={false} className="min-h-svh">
      <AnalystSidebar
        currentAnalystName={currentAnalystName}
        conversationsWithUnread={consoleState.conversationsWithUnread}
        logoutError={logoutError}
        isLoggingOut={isLoggingOut}
        onLogout={() => void logout()}
      />

      <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-col overflow-hidden bg-white">
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <AnalystQueuePanel
            conversations={consoleState.conversations}
            filteredConversations={consoleState.filteredConversations}
            selectedId={consoleState.selectedId}
            currentAnalystId={currentAnalystId}
            now={consoleState.now}
            search={consoleState.search}
            conversationFilter={consoleState.conversationFilter}
            hasSelectedConversation={Boolean(consoleState.selectedConversation)}
            employeeIsOnline={consoleState.employeeIsOnline}
            typingBySessionId={consoleState.typingBySessionId}
            onSearchChange={consoleState.setSearch}
            onFilterChange={consoleState.setConversationFilter}
            onSelect={(conversationId) => {
              void consoleState.selectConversation(conversationId);
            }}
          />

          <AnalystChatPanel
            conversation={consoleState.selectedConversation}
            currentAnalystId={currentAnalystId}
            currentAnalystName={currentAnalystName}
            now={consoleState.now}
            waitingCount={consoleState.waitingCount}
            employeeIsOnline={consoleState.employeeIsOnline}
            conversationError={consoleState.conversationError}
            draft={consoleState.draft}
            isWorking={consoleState.isWorking}
            workingAction={consoleState.workingAction}
            onDraftChange={consoleState.setDraft}
            peerIsTyping={consoleState.peerIsTyping}
            onTypingActivity={consoleState.notifyTyping}
            onBack={consoleState.clearSelection}
            onPerformAction={(action) =>
              void consoleState.performConversationAction(action)
            }
            onSendMessage={(event) => {
              consoleState.stopTyping();
              consoleState.sendMessage(event);
            }}
            onTicketStatusChange={consoleState.handleTicketStatusChange}
            onUnseenCountChange={consoleState.setOpenChatUnseen}
          />

          {consoleState.selectedConversation ? (
            <AnalystTicketsAside
              conversation={consoleState.selectedConversation}
              currentAnalystId={currentAnalystId}
              onTicketStatusChange={consoleState.handleTicketStatusChange}
            />
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
