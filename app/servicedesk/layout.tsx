import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function ServiceDeskLayout({ children }: { children: ReactNode }) {
  await connection();
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "EMPLOYEE") redirect("/analista");

  return children;
}
