"use client";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ChatOption } from "@/lib/validations/chat-metadata";

const chipClassName = "h-auto rounded-md px-3 py-1.5 text-[11px] font-semibold";

function OptionChip({
  option,
  disabled,
  onSelect,
}: {
  option: ChatOption;
  disabled: boolean;
  onSelect: (option: ChatOption) => void;
}) {
  if (option.action === "end_conversation") {
    return (
      <AlertDialog>
        <AlertDialog.Trigger disabled={disabled}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={chipClassName}
          >
            {option.label}
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Encerrar conversa?</AlertDialog.Title>
            <AlertDialog.Description>
              Que bom que seu problema foi resolvido! Se precisar de ajuda, você
              pode abrir outra conversa depois.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
            <AlertDialog.Action
              variant="destructive"
              onClick={() => onSelect(option)}
            >
              Encerrar
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => onSelect(option)}
      className={chipClassName}
    >
      {option.label}
    </Button>
  );
}

export function ChatOptionChips({
  options,
  disabled = false,
  onSelect,
}: {
  options: ChatOption[];
  disabled?: boolean;
  onSelect: (option: ChatOption) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option, index) => (
        <OptionChip
          key={`${option.label}-${index}`}
          option={option}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
