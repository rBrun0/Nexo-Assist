import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "EMPLOYEE") redirect("/analyst");

  return children;
}
