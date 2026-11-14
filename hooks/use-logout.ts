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

    const result = await logoutRequest();
    if (!result.success) {
      console.error("Falha ao encerrar sessão:", result.error);
      setLogoutError("Não foi possível sair. Tente novamente.");
      setIsLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
    setIsLoggingOut(false);
  }

  return { logout, logoutError, isLoggingOut };
}
