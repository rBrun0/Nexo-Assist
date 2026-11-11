import { EmployeePage } from "@/components/employee/employee-page";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function EmployeeProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updatePassword?: string }>;
}) {
  const { updatePassword } = await searchParams;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <EmployeePage
      page="perfil"
      showPasswordForm={updatePassword === "1"}
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
