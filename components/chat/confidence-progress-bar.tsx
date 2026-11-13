"use client";

import {
  clampConfidenceScore,
  confidenceBarFillClass,
  type ConfidenceBarTone,
} from "@/lib/agent/confidence-bar";
import { cn } from "@/lib/utils";

export function ConfidenceProgressBar({
  score,
  tone,
  className,
}: {
  score: number;
  tone: ConfidenceBarTone;
  className?: string;
}) {
  const width = clampConfidenceScore(score);

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800",
        className,
      )}
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confiança ${width}%`}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          confidenceBarFillClass(tone),
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
