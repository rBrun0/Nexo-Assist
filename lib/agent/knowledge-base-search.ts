import type { TicketCategory } from "@prisma/client";

export type KnowledgeBaseArticle = {
  title: string;
  content: string;
  category: TicketCategory;
  keywords: string;
};

const SEARCH_STOP_WORDS = new Set([
  "com",
  "como",
  "das",
  "dos",
  "esta",
  "estou",
  "para",
  "pela",
  "pelo",
  "que",
  "uma",
]);

export function getKnowledgeSearchTerms(query: string) {
  return [
    ...new Set(
      query
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("pt-BR")
        .split(/[^\p{L}\p{N}]+/u)
        .filter(
          (term) =>
            term.length > 2 && !SEARCH_STOP_WORDS.has(term)
        )
    ),
  ].slice(0, 8);
}

function getArticleRelevance(article: KnowledgeBaseArticle, terms: string[]) {
  const title = article.title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
  const keywords = article.keywords
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
  const content = article.content
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");

  return terms.reduce(
    (score, term) =>
      score +
      (title.includes(term) ? 5 : 0) +
      (keywords.includes(term) ? 3 : 0) +
      (content.includes(term) ? 1 : 0),
    0
  );
}

export function rankKnowledgeBaseArticles<T extends KnowledgeBaseArticle>(
  articles: T[],
  query: string,
  limit = 5
) {
  const terms = getKnowledgeSearchTerms(query);
  if (terms.length === 0) return [];

  return articles
    .map((article) => ({
      article,
      relevance: getArticleRelevance(article, terms),
    }))
    .filter((result) => result.relevance > 0)
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        a.article.title.localeCompare(b.article.title, "pt-BR")
    )
    .slice(0, limit)
    .map(({ article, relevance }) => ({ ...article, relevance }));
}
