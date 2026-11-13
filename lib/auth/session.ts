import "server-only";

import type { Role } from "@prisma/client";

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

export async function requireUser(role?: Role): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthSessionError("Sessão necessária.", 401);
  }
  if (role && user.role !== role) {
    throw new AuthSessionError(
      role === "ANALYST"
        ? "Sessão de analista necessária."
        : "Sessão de funcionário necessária.",
      401
    );
  }
  return user;
}

export class AuthSessionError extends Error {
  constructor(
    message: string,
    readonly statusCode: 401 | 403 = 401
  ) {
    super(message);
    this.name = "AuthSessionError";
  }
}
