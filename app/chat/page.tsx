import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function ChatRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "ANALYST") redirect("/analyst");
  redirect("/employee/atendimento");
}
