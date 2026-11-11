import "server-only";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function updateUserPassword(userId: string, password: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashPassword(password) },
  });
}
