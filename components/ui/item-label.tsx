import type { ReactNode } from "react";

export function ItemLabel({
  title,
  value,
}: {
  title: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs tracking-wide text-slate-500">{title}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
