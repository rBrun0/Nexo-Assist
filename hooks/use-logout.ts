"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logout as logoutRequest } from "@/lib/api/auth";

export function useLogout() {
  const router = useRouter();
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await logoutRequest();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Falha ao encerrar sessão:", error);
      setLogoutError("Não foi possível sair. Tente novamente.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return { logout, logoutError, isLoggingOut };
}
