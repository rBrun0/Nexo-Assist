"use client";

import { UserAvatar } from "@/components/chat/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getInitials } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";

export function AnalystAccountPopover({
  name,
  email,
  job,
  className,
  avatarClassName,
  side = "top",
  align = "center",
}: {
  name: string;
  email: string;
  job: string | null;
  className?: string;
  avatarClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}) {
  const initials = getInitials(name);
  const jobLabel = job?.trim() || "Analista";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Conta de ${name}`}
            className={cn("cursor-pointer rounded-full ring-2 ring-white", className)}
          />
        }
      >
        <UserAvatar initials={initials} className={cn("size-9 text-[11px]", avatarClassName)} />
      </PopoverTrigger>
      <PopoverContent align={align} side={side} sideOffset={8} className="w-64 gap-2 p-3">
        <PopoverHeader className="gap-1">
          <PopoverTitle className="truncate text-sm text-slate-900">{name}</PopoverTitle>
          <PopoverDescription className="truncate text-[12px] leading-4 text-slate-500">
            {jobLabel}
          </PopoverDescription>
          <p className="truncate text-[12px] leading-4 text-slate-500">{email}</p>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
