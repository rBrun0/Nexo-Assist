import { cn } from "@/lib/utils";

const MARK_SRC = "/brand/nexo-mark.png";

export function NexoMark({
  size = 32,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand mark needs lossless transparent PNG without optimizer boxing
    <img
      src={MARK_SRC}
      alt="Nexo"
      width={size}
      height={size}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={cn("block bg-transparent object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
