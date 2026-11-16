"use client";

import { LogOut, MessageCircle } from "lucide-react";
import Link from "next/link";

import { AnalystAccountPopover } from "@/components/analyst/analyst-account-popover";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";
import { NexoMark } from "@/components/brand/nexo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AnalystSidebar({
  currentAnalystName,
  currentAnalystEmail,
  currentAnalystJob,
  conversationsWithUnread = 0,
  logoutError,
  isLoggingOut,
  onLogout,
}: {
  currentAnalystName: string;
  currentAnalystEmail: string;
  currentAnalystJob: string | null;
  conversationsWithUnread?: number;
  logoutError: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const unreadBadge = conversationsWithUnread > 9 ? "9+" : String(conversationsWithUnread);
  const conversationsLabel =
    conversationsWithUnread > 0
      ? `Conversas, ${conversationsWithUnread} com mensagens novas`
      : "Conversas";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white"
      innerSidebarClassName="bg-surface-subtle"
    >
      <SidebarHeader className="items-center px-2 pt-4">
        <Link
          href="/analista"
          aria-label="Nexo Assist, console do analista"
          className="flex size-9 items-center justify-center"
        >
          <NexoMark size={24} className="size-9" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="items-center px-2 pt-2">
        <SidebarMenu className="w-auto gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive
              tooltip="Conversas"
              aria-label={conversationsLabel}
              className="relative size-10 justify-center rounded-xl text-slate-500 data-[active=true]:bg-sidebar-accent data-[active=true]:text-brand-nav-active"
            >
              <MessageCircle className="size-6" />

              {conversationsWithUnread > 0 ? (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-action px-1 text-[9px] font-semibold text-white">
                  {unreadBadge}
                </span>
              ) : null}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="items-center px-2 pb-4">
        <SidebarSeparator className="my-2 w-8 bg-slate-200" />
        <AnalystAccountPopover
          name={currentAnalystName}
          email={currentAnalystEmail}
          job={currentAnalystJob}
          side="right"
          align="end"
        />
        <LogoutConfirmDialog isLoggingOut={isLoggingOut} onLogout={onLogout}>
          <button
            type="button"
            aria-label="Sair"
            title="Sair"
            disabled={isLoggingOut}
            className="mt-1 flex size-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut className="size-4" />
          </button>
        </LogoutConfirmDialog>
        {logoutError ? (
          <p role="alert" className="max-w-24 text-center text-[10px] text-red-600">
            {logoutError}
          </p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
