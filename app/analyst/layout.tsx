import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function AnalystLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "ANALYST") redirect("/employee/atendimento");

  return children;
}
