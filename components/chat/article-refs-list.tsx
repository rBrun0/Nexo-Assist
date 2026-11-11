"use client";

import { BookOpen } from "lucide-react";

export function ArticleRefsList({
  articles,
  disabled = false,
  onSelect,
}: {
  articles: Array<{ title: string; category?: string }>;
  disabled?: boolean;
  onSelect: (article: { title: string; category?: string }) => void;
}) {
  if (articles.length === 0) return null;

  return (
    <div className="space-y-2">
      {articles.map((article, index) => (
        <button
          key={`${article.title}-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(article)}
          className="flex w-full items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/50 disabled:opacity-50"
        >
          <BookOpen className="mt-0.5 size-3.5 shrink-0 text-brand-action" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-800">
              {article.title}
            </span>
            {article.category ? (
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {article.category}
              </span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}
