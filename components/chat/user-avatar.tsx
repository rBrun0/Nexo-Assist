import { cn } from "@/lib/utils";

export function UserAvatar({
  initials,
  online,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  initials: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}) {
  const sizeClass =
    size === "lg" ? "size-16 text-lg" : size === "sm" ? "size-8 text-[10px]" : "size-9 text-[10px]";

  return (
    <span
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 font-semibold text-blue-800",
        sizeClass,
        className,
      )}
    >
      {initials}
      {online ? (
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500"
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}
