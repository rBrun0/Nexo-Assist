"use client";

import type { ReactNode } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";

export function LogoutConfirmDialog({
  isLoggingOut,
  onLogout,
  children,
}: {
  isLoggingOut: boolean;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger disabled={isLoggingOut}>{children}</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Tem certeza que deseja sair?</AlertDialog.Title>
          <AlertDialog.Description>Você será deslogado da sua conta.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer className="grid grid-cols-2 sm:grid sm:grid-cols-2">
          <AlertDialog.Cancel disabled={isLoggingOut} className="h-9">
            Cancelar
          </AlertDialog.Cancel>
          <AlertDialog.Action
            variant="destructive"
            disabled={isLoggingOut}
            onClick={onLogout}
            className="h-9"
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
