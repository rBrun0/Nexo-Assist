import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/agent/confidence";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import { confidenceBand } from "@/lib/mastra/reconcile-decision";

export type ConfidenceBarTone = "high" | "medium" | "low";

export function resolveConfidenceBarTone(input: {
  band?: string | null;
  score?: number | null;
}): ConfidenceBarTone {
  const band = input.band;
  if (band === "high" || band === "medium" || band === "low") {
    return band;
  }

  if (typeof input.score === "number" && Number.isFinite(input.score)) {
    return confidenceBand(input.score);
  }

  return "medium";
}

export function confidenceBarFillClass(tone: ConfidenceBarTone) {
  switch (tone) {
    case "high":
      return "bg-emerald-500";
    case "low":
      return "bg-rose-500";
    default:
      return "bg-amber-400";
  }
}

export function clampConfidenceScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function confidenceLabelForTone(tone: ConfidenceBarTone) {
  return CONFIDENCE_LABELS[tone];
}

export { LOW_CONFIDENCE_THRESHOLD };
