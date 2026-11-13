import "server-only";

import { prisma } from "@/lib/prisma";
import { acceptsDemoPassword } from "@/lib/auth/demo-accounts";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function authenticateLocalUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, password: true },
  });

  if (!user?.password) return null;

  const result = verifyPassword(password, user.password);
  const demoBypass = !result.valid && acceptsDemoPassword(user.email, password);
  if (!result.valid && !demoBypass) return null;

  if (result.valid && result.needsRehash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(password) },
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
