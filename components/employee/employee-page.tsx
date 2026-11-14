"use client";

import { useRef } from "react";

import { ChatScrollToBottom } from "@/components/chat/chat-scroll-to-bottom";
import { EmployeeComposer } from "@/components/employee/employee-composer";
import { EmployeeEmptyState } from "@/components/employee/employee-empty-state";
import { EmployeeMessageList } from "@/components/employee/employee-message-list";
import { EmployeeProfile } from "@/components/employee/employee-profile";
import { EmployeeSidebar } from "@/components/employee/employee-sidebar";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useChatScrollFab } from "@/hooks/use-chat-scroll-fab";
import { useEmployeeConversation } from "@/hooks/use-employee-conversation";
import { useLogout } from "@/hooks/use-logout";
import { getFirstName } from "@/lib/format/person-name";

type EmployeePageType = "atendimento" | "perfil";

export function EmployeePage({
  page,
  employee,
  showPasswordForm = false,
}: {
  page: EmployeePageType;
  employee: { id: string; name: string; email: string; initials: string };
  showPasswordForm?: boolean;
}) {
  const { logout, logoutError, isLoggingOut } = useLogout();
  const isProfilePage = page === "perfil";
  const pagePath = isProfilePage ? (
    <div className="flex items-center gap-2">
      <span>Service desk de TI</span> <span>&gt;</span>{" "}
      <b className="text-black">Meu perfil</b>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span>Service desk de TI</span> <span>&gt;</span>{" "}
      <b className="text-black">Atendimento</b>
    </div>
  );

  const chat = useEmployeeConversation({
    employee,
    enabled: !isProfilePage,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { showFab, newCount, scrollToBottom } = useChatScrollFab({
    scrollRef,
    endRef: chat.messagesEndRef,
    messageCount: chat.messages.length,
    stickSignal: `${chat.streamedResponseText.length}:${chat.agentActivitySteps.length}:${chat.isSendingMessage ? 1 : 0}`,
  });

  return (
    <SidebarProvider>
      <EmployeeSidebar
        isProfilePage={isProfilePage}
        employee={employee}
        logoutError={logoutError}
        isLoggingOut={isLoggingOut}
        onLogout={() => void logout()}
      />

      <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden">
        <header className="flex flex-col md:flex-row gap-2 md:h-[72px] shrink-0 items-start md:items-center justify-between border-b border-slate-200/80 bg-white px-5 py-2 md:py-0 sm:px-12">
          <div>
            <p className="text-sm text-zinc-500">{pagePath}</p>
          </div>
          {!isProfilePage ? (
            <Badge
              pastelFromText={chat.statusBadge.pastelKey}
              className="h-7 gap-1.5 rounded-full border-none! px-2.5 text-[11px] font-medium"
              aria-label={chat.statusBadge.aria}
            >
              <span
                className={`size-1.5 rounded-full ${chat.statusBadge.dotClass}`}
              />
              {chat.statusBadge.label}
            </Badge>
          ) : null}
        </header>

        {!isProfilePage ? (
          <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div
                ref={scrollRef}
                className="chat-scroll h-full min-h-0 overflow-y-auto px-6 pt-2 pb-6 sm:px-8"
              >
                {chat.isLoadingConversation ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Carregando sua conversa...
                  </div>
                ) : chat.messages.length === 0 && !chat.isSendingMessage ? (
                  <EmployeeEmptyState
                    firstName={getFirstName(employee.name)}
                    endedNotice={chat.endedNotice}
                    onSuggestionSelect={(title) =>
                      void chat.submitMessage(title)
                    }
                  />
                ) : (
                  <EmployeeMessageList
                    messages={chat.messages}
                    isSendingMessage={
                      chat.isAwaitingAssistant || chat.isEndingConversation
                    }
                    agentActivitySteps={chat.agentActivitySteps}
                    streamedResponseText={chat.streamedResponseText}
                    peerIsTyping={chat.peerIsTyping}
                    lastInteractiveAssistantMessageId={
                      chat.lastInteractiveAssistantMessageId
                    }
                    messagesEndRef={chat.messagesEndRef}
                    onOptionSelect={chat.handleOptionSelect}
                    onTicketSelect={chat.handleTicketSelect}
                    onArticleSelect={chat.handleArticleSelect}
                    onConfirmDraft={(draftMessageId) =>
                      void chat.confirmTicketDraft(draftMessageId)
                    }
                    onEditDraft={chat.editTicketDraft}
                    onCancelDraft={(draftMessageId) =>
                      void chat.cancelTicketDraftAction(draftMessageId)
                    }
                  />
                )}
              </div>
              <ChatScrollToBottom
                visible={showFab}
                newCount={newCount}
                typing={
                  chat.peerIsTyping ||
                  (chat.isAwaitingAssistant && !chat.streamedResponseText)
                }
                onClick={scrollToBottom}
              />
            </div>

            <EmployeeComposer
              messageCount={chat.messageCount}
              messageLimit={chat.messageLimit}
              message={chat.message}
              conversationError={chat.conversationError}
              conversationStatus={chat.conversation?.status}
              isSendingMessage={chat.isSendingMessage}
              isLoadingConversation={chat.isLoadingConversation}
              isAtMessageLimit={chat.isAtMessageLimit}
              isRequestingAnalyst={chat.isRequestingAnalyst}
              isEndingConversation={chat.isEndingConversation}
              onMessageChange={chat.setMessage}
              onTypingActivity={chat.notifyTyping}
              onSubmit={(event) => {
                chat.stopTyping();
                void chat.handleSubmit(event);
              }}
              onRequestAnalyst={() => void chat.requestAnalystFromLimit()}
              onEndConversation={() => void chat.endConversationAction()}
            />
          </main>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EmployeeProfile
              employee={employee}
              showPasswordForm={showPasswordForm}
            />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
