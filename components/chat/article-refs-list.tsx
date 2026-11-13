"use client";

import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

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
        <Button
          key={`${article.title}-${index}`}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(article)}
          className="h-auto w-full items-start justify-start gap-2 rounded-xl px-3 py-2 text-left whitespace-normal"
        >
          <BookOpen className="mt-0.5 size-3.5 shrink-0 text-brand-action" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-800">
              {article.title}
            </span>
            {article.category ? (
              <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                {article.category}
              </span>
            ) : null}
          </span>
        </Button>
      ))}
    </div>
  );
}
