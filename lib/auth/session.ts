import "server-only";

import type { Role } from "@prisma/client";

import { AppErrors, DomainError, fromDomain, type Result } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getLocalSession } from "@/lib/auth/local-session";

export async function getCurrentUser() {
  const session = await getLocalSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, job: true },
  });
  if (!user || user.email !== session.email) return null;
  return user;
}

export type AppUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(role?: Role): Promise<Result<AppUser>> {
  return fromDomain(async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw new DomainError(AppErrors.sessionRequired);
    }
    if (role && user.role !== role) {
      throw new DomainError(
        role === "ANALYST"
          ? AppErrors.analystSessionRequired
          : AppErrors.employeeSessionRequired,
      );
    }
    return user;
  });
}
