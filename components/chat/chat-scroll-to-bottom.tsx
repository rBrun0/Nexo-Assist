"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { TypingDots } from "@/components/chat/chat-typing-indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatScrollToBottom({
  visible,
  newCount = 0,
  typing = false,
  onClick,
  className,
}: {
  visible: boolean;
  newCount?: number;
  typing?: boolean;
  onClick: () => void;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-4 bottom-4 z-20 sm:right-6",
        className,
      )}
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={onClick}
        aria-label={
          typing
            ? "Alguém está digitando. Descer para o fim da conversa"
            : newCount > 0
              ? `Descer para ${newCount} mensagem${newCount === 1 ? "" : "ns"} nova${newCount === 1 ? "" : "s"}`
              : "Descer para o fim da conversa"
        }
        className={cn(
          "pointer-events-auto relative size-10 rounded-full shadow-md transition-colors duration-300",
          typing
            ? "border-success/30 bg-emerald-50 hover:bg-emerald-100"
            : "border-slate-200 bg-white hover:bg-slate-50",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {typing ? (
            <motion.span
              key="typing"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <TypingDots />
            </motion.span>
          ) : (
            <motion.span
              key="down"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <ChevronDown className="size-4 text-slate-700" />
            </motion.span>
          )}
        </AnimatePresence>
        {newCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-action px-1 text-[10px] font-semibold text-white">
            {newCount > 99 ? "99+" : newCount}
          </span>
        ) : null}
      </Button>
    </div>
  );
}
