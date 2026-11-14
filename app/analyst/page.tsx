import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AnalystConsole } from "@/components/analyst/analyst-console";
import { getCurrentUser } from "@/lib/auth/session";
import { listAnalystConversations } from "@/lib/services/conversations";

export default async function AnalystPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ANALYST") redirect("/employee/atendimento");

  const initialConversations = await listAnalystConversations();

  return (
    <AnalystConsole
      initialConversations={initialConversations}
      currentAnalystId={user.id}
      currentAnalystName={user.name}
    />
  );
}
