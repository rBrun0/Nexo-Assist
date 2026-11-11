import { redirect } from "next/navigation";

import { LoginPage } from "@/components/auth/login-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getResolvedWithoutQueuePercent } from "@/lib/services/login-stats";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ANALYST" ? "/analyst" : "/chat");

  const resolvedWithoutQueuePercent = await getResolvedWithoutQueuePercent();

  return (
    <LoginPage resolvedWithoutQueuePercent={resolvedWithoutQueuePercent} />
  );
}
