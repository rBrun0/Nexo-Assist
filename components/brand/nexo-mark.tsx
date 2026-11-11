import Image from "next/image";

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
    <Image
      src={MARK_SRC}
      alt="Nexo"
      width={size}
      height={size}
      priority={priority}
      className={cn("bg-transparent object-contain", className)}
    />
  );
}
