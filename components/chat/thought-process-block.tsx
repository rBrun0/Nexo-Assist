"use client";

import { Brain } from "lucide-react";

import { AgentActivityTrail } from "@/components/chat/agent-activity-trail";
import { AgentFeedbackPanel } from "@/components/chat/agent-feedback-button";
import { ConfidenceProgressBar } from "@/components/chat/confidence-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { activityStepsFromThoughtProcess } from "@/lib/agent/activity";
import {
  clampConfidenceScore,
  confidenceLabelForTone,
  resolveConfidenceBarTone,
} from "@/lib/agent/confidence-bar";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isRecord } from "@/lib/utils/is-record";

function confidenceParts(thoughtProcess: Record<string, unknown>) {
  const raw = thoughtProcess.confidence;
  const key = typeof raw === "string" ? raw : "";
  const rawScore = thoughtProcess.confidenceScore;
  const score =
    typeof rawScore === "number" && Number.isFinite(rawScore)
      ? clampConfidenceScore(rawScore)
      : null;
  const tone = resolveConfidenceBarTone({
    band: key || null,
    score,
  });
  const label =
    key in CONFIDENCE_LABELS
      ? CONFIDENCE_LABELS[key as keyof typeof CONFIDENCE_LABELS]
      : confidenceLabelForTone(tone);

  return { key: key || null, label, score, tone };
}

export function ThoughtProcessBlock({
  thoughtProcess,
  showTrail = true,
  messageId,
  className,
}: {
  thoughtProcess: unknown;
  showTrail?: boolean;
  messageId?: string;
  className?: string;
}) {
  if (!isRecord(thoughtProcess)) return null;

  const steps = activityStepsFromThoughtProcess(thoughtProcess);
  const rationale =
    thoughtProcess.rationale != null && thoughtProcess.rationale !== ""
      ? String(thoughtProcess.rationale)
      : null;
  const {
    key: confidenceKey,
    label: confidenceLabel,
    score,
    tone,
  } = confidenceParts(thoughtProcess);
  const confidenceText =
    confidenceLabel && score != null
      ? `${confidenceLabel} (${score}%)`
      : confidenceLabel
        ? confidenceLabel
        : score != null
          ? `${score}%`
          : null;
  const hasMeta = confidenceText != null || rationale != null;
  const hasSteps = steps.length > 0;
  const showPopover = hasMeta || hasSteps;

  if (!showTrail && !showPopover) return null;
  if (showTrail && !hasSteps && !hasMeta) return null;

  const pastelKey =
    confidenceKey && confidenceKey in CONFIDENCE_LABELS
      ? confidenceKey
      : tone;

  return (
    <div
      className={cn(
        "mb-0 flex min-w-0 flex-nowrap items-center gap-1.5",
        className,
      )}
    >
      {showPopover ? (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Ver decisão do agente"
                className="size-5 shrink-0 cursor-pointer text-slate-500 hover:text-slate-700"
              />
            }
          >
            <Brain className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            className="w-[min(18rem,calc(100vw-2rem))] gap-2.5 p-3"
          >
            <PopoverHeader>
              <PopoverTitle className="text-sm text-slate-900">
                Decisão do agente
              </PopoverTitle>
              <PopoverDescription className="text-[12px] leading-4 text-slate-500">
                Resumo público das ações, confiança e motivo desta resposta.
              </PopoverDescription>
            </PopoverHeader>
            {hasSteps ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Ações
                </span>
                <AgentActivityTrail steps={steps} stacked />
              </div>
            ) : null}
            {confidenceText ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    Confiança
                  </span>
                  <Badge
                    variant="outline"
                    pastelFromText={pastelKey}
                    className="h-5 border px-2 text-[10px] font-semibold"
                  >
                    {confidenceText}
                  </Badge>
                </div>
                {score != null ? (
                  <ConfidenceProgressBar score={score} tone={tone} />
                ) : null}
              </div>
            ) : null}
            {rationale ? (
              <p className="text-[12.5px] leading-5 text-slate-700">
                <span className="font-medium text-slate-800">Por quê: </span>
                {rationale}
              </p>
            ) : null}
            {messageId ? <AgentFeedbackPanel messageId={messageId} /> : null}
          </PopoverContent>
        </Popover>
      ) : null}
      {showTrail && hasSteps ? (
        <AgentActivityTrail steps={steps} className="mb-0 min-w-0 flex-1" />
      ) : null}
    </div>
  );
}
