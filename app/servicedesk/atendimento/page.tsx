import { redirect } from "next/navigation";
import { EmployeePage } from "@/components/employee/employee-page";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ServiceDeskSupportPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <EmployeePage
      page="atendimento"
      employee={{
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }}
    />
  );
}
