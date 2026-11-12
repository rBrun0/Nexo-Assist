"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import {
  FormInputField,
  type FormInputFieldProps,
} from "@/components/form/form-input-field";

export type PasswordInputFieldProps = Omit<
  FormInputFieldProps,
  "type" | "leadingIcon" | "trailing"
> & {
  revealable?: boolean;
};

export function PasswordInputField({
  revealable = true,
  autoComplete = "current-password",
  ...props
}: PasswordInputFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FormInputField
      {...props}
      type={revealable && visible ? "text" : "password"}
      autoComplete={autoComplete}
      leadingIcon={LockKeyhole}
      trailing={
        revealable ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors group-focus-within/control:text-brand-logo hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-logo"
          >
            {visible ? (
              <EyeOff className="size-[17px]" />
            ) : (
              <Eye className="size-[17px]" />
            )}
          </button>
        ) : null
      }
    />
  );
}
