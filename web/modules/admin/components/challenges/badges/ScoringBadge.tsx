import { cn } from "@/lib/utils";

export function ScoringBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 font-mono text-[9px] ring-1",
        type === "dynamic"
          ? "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20"
          : "bg-slate-700/40 text-slate-500 ring-slate-700/50",
      )}
    >
      {type}
    </span>
  );
}