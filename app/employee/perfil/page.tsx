import { redirect } from "next/navigation";

export default async function LegacyEmployeeProfileRedirect({
  searchParams,
}: {
  searchParams: Promise<{ updatePassword?: string }>;
}) {
  const { updatePassword } = await searchParams;
  if (updatePassword === "1") {
    redirect("/servicedesk/perfil?updatePassword=1");
  }
  redirect("/servicedesk/perfil");
}
