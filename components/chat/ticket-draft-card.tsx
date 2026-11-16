"use client";

import { Button } from "@/components/ui/button";
import { ItemLabel } from "@/components/ui/item-label";
import { Separator } from "@/components/ui/separator";
import { formatTicketCategoryLabel, formatTicketPriorityLabel } from "@/lib/i18n/ticket-labels";
import { formatSlaArrivalLabel } from "@/lib/services/ticket-sla";
import { cn } from "@/lib/utils";
import type { TicketDraftPresentation } from "@/lib/validations/ticket";

function formatDraftCode(workflowRunId?: string) {
  if (!workflowRunId?.trim()) return "Rascunho";
  const compact = workflowRunId.replace(/[^a-zA-Z0-9]/g, "");
  const suffix = compact.slice(-4).toUpperCase();
  if (suffix.length < 4) return "Rascunho";
  return `Rascunho-${suffix}`;
}

function formatAffectedLabel(impact: unknown) {
  if (impact === "team") return "Equipe";
  if (impact === "company") return "Empresa";
  return "Você";
}

export function TicketDraftCard({
  draft,
  workflowRunId,
  confirmed = false,
  cancelled = false,
  disabled = false,
  onConfirm,
  onEdit,
  onCancel,
}: {
  draft: TicketDraftPresentation | Record<string, unknown>;
  workflowRunId?: string;
  confirmed?: boolean;
  cancelled?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const title = String(draft.title ?? "");
  const description = String(draft.description ?? "");
  const category = formatTicketCategoryLabel(String(draft.category ?? ""));
  const priority = formatTicketPriorityLabel(String(draft.priority ?? ""));
  const slaIso = typeof draft.slaDeadlineIso === "string" ? draft.slaDeadlineIso : "";
  const slaLine = slaIso ? formatSlaArrivalLabel(slaIso) : "";
  const affected = formatAffectedLabel(draft.impact);
  const draftCode = formatDraftCode(workflowRunId);

  const status = confirmed
    ? { label: "confirmado", text: "text-success", dot: "bg-success" }
    : cancelled
      ? { label: "cancelado", text: "text-slate-500", dot: "bg-slate-400" }
      : {
          label: "aguardando confirmação",
          text: "text-warning-text",
          dot: "bg-warning-text",
        };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-slate-500">
            Novo chamado
            <span className="text-slate-300"> · </span>
            {draftCode}
          </p>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs", status.text)}>
            <span className={cn("size-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold text-slate-800">{title}</p>
        {description ? (
          <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-5 text-zinc-600">
            {description}
          </p>
        ) : null}
        <Separator className="my-3" />
        <div className="grid grid-cols-3 justify-between gap-x-4 gap-y-3">
          <ItemLabel title="Categoria" value={category || "—"} />
          <ItemLabel
            title="Prioridade"
            value={
              slaLine ? (
                <span className="flex flex-col gap-0.5">
                  <span>{priority || "—"}</span>
                  <span className="text-xs font-normal text-slate-500">{slaLine}</span>
                </span>
              ) : (
                priority || "—"
              )
            }
          />
          <ItemLabel title="Afetados" value={affected} />
        </div>
      </div>
      {confirmed || cancelled ? null : (
        <div className="flex flex-wrap justify-start gap-2 bg-slate-100 border-t border-t-slate-200 px-4 py-3">
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={onConfirm}
            className="h-8 bg-brand-action text-white hover:bg-brand-action-hover"
          >
            Confirmar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={onEdit}
            className="h-8 bg-white"
          >
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onCancel}
            className="h-8 text-slate-600"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
