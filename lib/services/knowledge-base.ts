import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getKnowledgeSearchTerms,
  rankKnowledgeBaseArticles,
} from "@/lib/agent/knowledge-base-search";

export async function searchKnowledgeBase(query: string) {
  const terms = getKnowledgeSearchTerms(query);
  if (terms.length === 0) return [];

  const candidates = await prisma.knowledgeBase.findMany({
    where: {
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" as const } },
        { content: { contains: term, mode: "insensitive" as const } },
        { keywords: { contains: term, mode: "insensitive" as const } },
      ]),
    },
    select: {
      title: true,
      content: true,
      category: true,
      keywords: true,
    },
    take: 50,
  });

  return rankKnowledgeBaseArticles(candidates, query);
}
