"use client";

import { ArticleRefsList } from "@/components/chat/article-refs-list";
import { AssistantTextBubble } from "@/components/chat/assistant-text-bubble";
import { ChatOptionChips } from "@/components/chat/chat-option-chips";
import type { ChatOption } from "@/lib/validations/chat-metadata";

export function ArticleRefsTurn({
  content,
  createdAt,
  articles,
  options = [],
  disabled = false,
  onArticleSelect,
  onOptionSelect,
}: {
  content: string;
  createdAt: string;
  articles: Array<{ title: string; category?: string }>;
  options?: ChatOption[];
  disabled?: boolean;
  onArticleSelect: (article: { title: string; category?: string }) => void;
  onOptionSelect: (option: ChatOption) => void;
}) {
  return (
    <div className="space-y-3">
      <AssistantTextBubble content={content} createdAt={createdAt} />
      <ArticleRefsList
        articles={articles}
        disabled={disabled}
        onSelect={onArticleSelect}
      />
      <ChatOptionChips
        options={options}
        disabled={disabled}
        onSelect={onOptionSelect}
      />
    </div>
  );
}
