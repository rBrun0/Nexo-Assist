"use client";

import { Button } from "@/components/ui/button";
import {
  formatTicketCategoryLabel,
  formatTicketPriorityLabel,
  formatTicketTypeLabel,
} from "@/lib/i18n/ticket-labels";
import { formatSlaArrivalLabel } from "@/lib/services/ticket-sla";
import type { TicketDraftPresentation } from "@/lib/validations/ticket";

export function TicketDraftCard({
  draft,
  confirmed = false,
  cancelled = false,
  disabled = false,
  onConfirm,
  onEdit,
  onCancel,
}: {
  draft: TicketDraftPresentation | Record<string, unknown>;
  confirmed?: boolean;
  cancelled?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const title = String(draft.title ?? "");
  const description = String(draft.description ?? "");
  const type = formatTicketTypeLabel(String(draft.type ?? ""));
  const category = formatTicketCategoryLabel(String(draft.category ?? ""));
  const priority = formatTicketPriorityLabel(String(draft.priority ?? ""), {
    withSla: true,
  });
  const slaIso =
    typeof draft.slaDeadlineIso === "string" ? draft.slaDeadlineIso : "";
  const slaLine = slaIso ? formatSlaArrivalLabel(slaIso) : "";

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 whitespace-pre-wrap">{description}</p>
      <p className="mt-2 text-slate-500">
        {type} · {category} · {priority}
      </p>
      {slaLine ? (
        <p className="mt-2 font-medium text-slate-700">{slaLine}</p>
      ) : null}
      {confirmed ? (
        <p className="mt-3 text-[11px] font-medium text-emerald-700">
          Chamado confirmado.
        </p>
      ) : cancelled ? (
        <p className="mt-3 text-[11px] font-medium text-slate-500">
          Rascunho cancelado. Nenhum chamado foi aberto.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={onConfirm}
            className="h-8"
          >
            Confirmar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={onEdit}
            className="h-8"
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
