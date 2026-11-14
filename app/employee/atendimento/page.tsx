import { redirect } from "next/navigation";

export default function LegacyEmployeeSupportRedirect() {
  redirect("/servicedesk/atendimento");
}
