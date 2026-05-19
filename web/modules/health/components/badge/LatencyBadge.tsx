import { cn } from "@/lib/utils";
import { fmt } from "@/shared/utils/fmt";

export function LatencyBadge({ ms }: { ms: number }) {
  const color =
    ms < 100
      ? "text-emerald-400"
      : ms < 500
        ? "text-amber-400"
        : "text-red-400";
  return (
    <span className={cn("font-mono text-[11px] tabular-nums", color)}>
      {fmt(ms)}
    </span>
  );
}