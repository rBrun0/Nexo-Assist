import {
  getKnowledgeSearchTerms,
  rankKnowledgeBaseArticles,
} from "@/lib/agent/knowledge-base-search";

const articles = [
  {
    title: "Configuração de e-mail no celular",
    content: "Configure o Outlook Mobile com MFA.",
    category: "EMAIL",
    keywords: "email, outlook, celular, mfa",
  },
  {
    title: "VPN com erro 809",
    content: "Reinstale o cliente de VPN pelo portal.",
    category: "NETWORK_VPN",
    keywords: "vpn, erro 809, rede",
  },
] as const;

describe("knowledge base search ranking", () => {
  it("normalizes Portuguese terms and removes common stop words", () => {
    expect(getKnowledgeSearchTerms("Como configurar o e-mail?")).toEqual([
      "configurar",
      "mail",
    ]);
  });

  it("ranks matching articles and excludes unrelated results", () => {
    const results = rankKnowledgeBaseArticles([...articles], "erro VPN");

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("VPN com erro 809");
    expect(results[0].relevance).toBeGreaterThan(0);
  });

  it("returns no candidates for a query with no searchable terms", () => {
    expect(rankKnowledgeBaseArticles([...articles], "oi")).toEqual([]);
  });
});
