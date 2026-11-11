"use client";

import { AgentActivityTrail } from "@/components/chat/agent-activity-trail";
import { activityStepsFromThoughtProcess } from "@/lib/agent/activity";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import { isRecord } from "@/lib/utils/is-record";

export function ThoughtProcessBlock({
  thoughtProcess,
  showTrail = true,
}: {
  thoughtProcess: unknown;
  showTrail?: boolean;
}) {
  if (!isRecord(thoughtProcess)) return null;

  const steps = activityStepsFromThoughtProcess(thoughtProcess);
  const confidence = thoughtProcess.confidence;
  const rationale =
    thoughtProcess.rationale != null && thoughtProcess.rationale !== ""
      ? String(thoughtProcess.rationale)
      : null;
  const hasDetails = confidence != null || rationale != null;

  const confidenceLabel =
    CONFIDENCE_LABELS[confidence as keyof typeof CONFIDENCE_LABELS] || null;

  if (!showTrail && !hasDetails) return null;
  if (showTrail && steps.length === 0 && !hasDetails) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {showTrail ? <AgentActivityTrail steps={steps} className="mb-0" /> : null}
      {hasDetails ? (
        <details className="rounded-lg px-1 text-[10px] text-slate-400">
          <summary className="cursor-pointer select-none text-slate-400 hover:text-slate-500">
            Detalhes
          </summary>
          <div className="mt-1.5 space-y-1 pl-0.5 text-[11px] leading-4 text-slate-500">
            {confidence != null ? (
              <p>Confiança: {String(confidenceLabel ?? confidence)}</p>
            ) : null}
            {rationale ? <p>{rationale}</p> : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}
