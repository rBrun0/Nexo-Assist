"use client";

import Link from "next/link";
import { LogOut, MessageCircle } from "lucide-react";

import { NexoMark } from "@/components/brand/nexo-mark";
import { UserAvatar } from "@/components/chat/user-avatar";
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
import { getInitials } from "@/lib/format/person-name";

export function AnalystSidebar({
  currentAnalystName,
  conversationsWithUnread = 0,
  logoutError,
  isLoggingOut,
  onLogout,
}: {
  currentAnalystName: string;
  conversationsWithUnread?: number;
  logoutError: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const initials = getInitials(currentAnalystName);
  const unreadBadge =
    conversationsWithUnread > 9 ? "9+" : String(conversationsWithUnread);
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
          href="/analyst"
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
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Chamados"
              aria-label="Chamados"
              className="size-10 justify-center rounded-xl text-slate-500"
            >
              <Ticket />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Equipe"
              aria-label="Equipe"
              className="size-10 justify-center rounded-xl text-slate-500"
            >
              <UsersRound />
            </SidebarMenuButton>
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="items-center px-2 pb-4">
        {/* <SidebarMenu className="w-auto"> */}
        {/* <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Ajuda"
              aria-label="Ajuda"
              className="size-10 justify-center rounded-xl text-slate-500"
            >
              <CircleHelp />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem> */}
        {/* <SidebarMenuButton
              tooltip="Configurações"
              aria-label="Configurações"
              className="size-10 justify-center rounded-xl text-slate-500"
            >
              <Settings />
            </SidebarMenuButton> */}
        {/* </SidebarMenuItem> */}
        {/* </SidebarMenu> */}
        <SidebarSeparator className="my-2 w-8 bg-slate-200" />
        <button
          type="button"
          aria-label={`Perfil de ${currentAnalystName}`}
          title={currentAnalystName}
          className="rounded-full ring-2 ring-white"
        >
          <UserAvatar initials={initials} className="size-9 text-[11px]" />
        </button>
        <button
          type="button"
          aria-label="Sair"
          title="Sair"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="mt-1 flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="size-4" />
        </button>
        {logoutError ? (
          <p
            role="alert"
            className="max-w-24 text-center text-[10px] text-red-600"
          >
            {logoutError}
          </p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
