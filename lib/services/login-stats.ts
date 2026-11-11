import "server-only";

import { ChatStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** % de conversas CLOSED resolvidas pelo bot sem handoff (fila humana). */
export async function getResolvedWithoutQueuePercent() {
  const [totalClosed, withoutQueue] = await Promise.all([
    prisma.chatSession.count({
      where: { status: ChatStatus.CLOSED },
    }),
    prisma.chatSession.count({
      where: {
        status: ChatStatus.CLOSED,
        handoffAt: null,
      },
    }),
  ]);

  if (totalClosed === 0) return 0;
  return Math.round((withoutQueue / totalClosed) * 100);
}
