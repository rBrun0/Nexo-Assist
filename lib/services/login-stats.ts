import "server-only";

import { ChatStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

const LOGIN_STATS_REVALIDATE_SECONDS = 120;

async function loadResolvedWithoutQueuePercent() {
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

async function loadAverageFirstResponseSeconds() {
  const rows = await prisma.$queryRaw<Array<{ seconds: bigint | number | null }>>`
    WITH recent AS (
      SELECT id
      FROM "ChatSession"
      ORDER BY "createdAt" DESC
      LIMIT 500
    ),
    first_employee AS (
      SELECT DISTINCT ON (m."chatSessionId")
        m."chatSessionId",
        m."createdAt"
      FROM "ChatMessage" m
      INNER JOIN recent r ON r.id = m."chatSessionId"
      WHERE m.sender = 'EMPLOYEE'::"MessageSender"
      ORDER BY m."chatSessionId", m."createdAt" ASC
    ),
    first_assistant AS (
      SELECT DISTINCT ON (m."chatSessionId")
        m."chatSessionId",
        m."createdAt"
      FROM "ChatMessage" m
      INNER JOIN recent r ON r.id = m."chatSessionId"
      WHERE m.sender = 'ASSISTANT'::"MessageSender"
      ORDER BY m."chatSessionId", m."createdAt" ASC
    )
    SELECT COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (a."createdAt" - e."createdAt"))))::integer,
      0
    ) AS seconds
    FROM first_employee e
    INNER JOIN first_assistant a ON a."chatSessionId" = e."chatSessionId"
    WHERE a."createdAt" >= e."createdAt"
  `;

  const seconds = Number(rows[0]?.seconds ?? 0);
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.round(seconds));
}

/** % de conversas CLOSED resolvidas pelo bot sem handoff (fila humana). */
export const getResolvedWithoutQueuePercent = unstable_cache(
  loadResolvedWithoutQueuePercent,
  ["login-stats-resolved-without-queue"],
  { revalidate: LOGIN_STATS_REVALIDATE_SECONDS },
);

/** Média em segundos até a primeira resposta do assistente (até 500 sessões recentes). */
export const getAverageFirstResponseSeconds = unstable_cache(
  loadAverageFirstResponseSeconds,
  ["login-stats-avg-first-response"],
  { revalidate: LOGIN_STATS_REVALIDATE_SECONDS },
);
