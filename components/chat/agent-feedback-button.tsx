"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { submitAgentFeedbackAction } from "@/app/actions/agent-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Formulário embutido no painel de decisão do agente (evita popover aninhado). */
export function AgentFeedbackPanel({
  messageId,
  className,
  onSubmitted,
}: {
  messageId: string;
  className?: string;
  onSubmitted?: () => void;
}) {
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <p className={cn("text-[11px] text-slate-400", className)}>
        Feedback registrado. Obrigado.
      </p>
    );
  }

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className={cn(
          "h-7 w-full justify-start gap-1.5 px-1.5 text-[11px] font-normal text-slate-500 hover:text-slate-700",
          className,
        )}
        onClick={() => setExpanded(true)}
      >
        <Flag className="size-3 shrink-0" />
        O agente errou o contexto?
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2 border-t border-slate-100 pt-2", className)}>
      <p className="text-[11px] font-medium text-slate-600">
        Contestação de contexto
      </p>
      <p className="text-[11px] leading-4 text-slate-500">
        Registra um sinal para avaliação do agente. Descreva o problema se
        quiser.
      </p>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="O que estava errado? (opcional)"
        maxLength={500}
        className="min-h-16 text-sm"
        disabled={isPending}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setExpanded(false);
            setNote("");
          }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await submitAgentFeedbackAction({
                messageId,
                note: note.trim() || undefined,
              });
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              setSubmitted(true);
              toast.success("Feedback registrado. Obrigado.");
              onSubmitted?.();
            });
          }}
        >
          {isPending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
