"use client";

import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const formControlClassName =
  "h-12 rounded-xl border-slate-200 bg-white text-sm shadow-sm placeholder:text-slate-400 focus-visible:border-brand-logo focus-visible:ring-brand-logo/20";

export type FormFieldError = { message?: string } | undefined;

export type FormInputFieldProps = Omit<
  ComponentProps<"input">,
  "id" | "size"
> & {
  id: string;
  label: string;
  error?: FormFieldError;
  labelAction?: ReactNode;
  leadingIcon?: LucideIcon;
  trailing?: ReactNode;
  fieldClassName?: string;
  controlClassName?: string;
};

export function FormInputField({
  id,
  label,
  error,
  labelAction,
  leadingIcon: LeadingIcon,
  trailing,
  className,
  fieldClassName,
  controlClassName,
  ...inputProps
}: FormInputFieldProps) {
  const invalid = Boolean(error);

  return (
    <Field data-invalid={invalid} className={fieldClassName}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel
          htmlFor={id}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </FieldLabel>
        {labelAction}
      </div>
      <div className="relative">
        {LeadingIcon ? (
          <LeadingIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400"
          />
        ) : null}
        <Input
          id={id}
          aria-invalid={invalid}
          className={cn(
            formControlClassName,
            LeadingIcon && "pl-10",
            trailing && "pr-11",
            controlClassName,
            className,
          )}
          {...inputProps}
        />
        {trailing}
      </div>
      <FieldError errors={[error]} />
    </Field>
  );
}
