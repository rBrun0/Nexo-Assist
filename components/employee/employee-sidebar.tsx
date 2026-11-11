"use client";

import Link from "next/link";
import { LogOut, MessageSquareText, UserRound } from "lucide-react";

import { NexoMark } from "@/components/brand/nexo-mark";
import { UserAvatar } from "@/components/chat/user-avatar";
import { Button } from "@/components/ui/button";
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
import { AlertDialog } from "../ui/alert-dialog";

export function EmployeeSidebar({
  isProfilePage,
  employee,
  logoutError,
  isLoggingOut,
  onLogout,
}: {
  isProfilePage: boolean;
  employee: { name: string; email: string; initials: string };
  logoutError: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-slate-200">
      <SidebarHeader className="gap-8 px-5 pt-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-1 text-[19px] font-bold tracking-tight text-slate-900"
          aria-label="Nexo Assist, página inicial"
        >
          <NexoMark size={32} className="size-8" />
          <span>
            Nexo <span className="text-brand-logo">Assist</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-8">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={!isProfilePage}
              render={<Link href="/employee/atendimento" />}
              className="h-10 gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-600 data-[active=true]:bg-sidebar-accent data-[active=true]:text-brand-nav-active data-[active=true]:shadow-none"
            >
              <MessageSquareText className="size-[17px]" />
              <span>Atendimento</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isProfilePage}
              render={<Link href="/employee/perfil" />}
              className="h-10 gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-600 data-[active=true]:bg-sidebar-accent data-[active=true]:text-brand-nav-active data-[active=true]:shadow-none"
            >
              <UserRound className="size-[17px]" />
              <span>Meu perfil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-4 pb-2 gap-1">
        <SidebarSeparator className="mb-4 bg-slate-200" />
        <User
          name={employee.name}
          initials={employee.initials}
          email={employee.email}
        />
        <AlertDialog>
          <AlertDialog.Trigger>
            <Button
              variant="ghost"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="mt-4 h-10 w-full justify-start gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="size-[17px]" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Title>Tem certeza que deseja sair?</AlertDialog.Title>
            <AlertDialog.Description>
              Você será deslogado da sua conta.
            </AlertDialog.Description>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  className="mt-4 h-10 w-full justify-start gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="size-[17px]" />
                  {isLoggingOut ? "Saindo..." : "Sair"}
                </Button>
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
        {logoutError ? (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {logoutError}
          </p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}

const User = ({
  name,
  initials,
  email,
}: {
  name: string;
  initials: string;
  email: string;
}) => {
  return (
    <div className="flex items-center gap-3 px-1">
      <UserAvatar
        initials={initials}
        className="size-10 text-xs ring-2 ring-white"
        aria-label={`Foto de ${name}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-slate-800">
          {name}
        </p>
        <p className="truncate text-[11px] text-slate-500">{email}</p>
      </div>
    </div>
  );
};
