import { redirect } from "next/navigation";

import { LoginPage } from "@/components/auth/login-page";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAverageFirstResponseSeconds,
  getResolvedWithoutQueuePercent,
} from "@/lib/services/login-stats";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ANALYST" ? "/analista" : "/chat");

  const [resolvedWithoutQueuePercent, averageFirstResponseSeconds] = await Promise.all([
    getResolvedWithoutQueuePercent(),
    getAverageFirstResponseSeconds(),
  ]);

  return (
    <LoginPage
      resolvedWithoutQueuePercent={resolvedWithoutQueuePercent}
      averageFirstResponseSeconds={averageFirstResponseSeconds}
      showDemoAccounts={process.env.NODE_ENV !== "production"}
    />
  );
}
