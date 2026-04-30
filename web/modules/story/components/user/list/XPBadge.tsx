import { Zap } from "lucide-react";

export function XPBadge({ xp }: { xp: number }) {
  if (!xp) return null;
  return (
    <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 ring-1 ring-yellow-500/20">
      <Zap className="h-2.5 w-2.5 text-yellow-400" />
      <span className="font-mono text-[9px] font-bold text-yellow-400">
        +{xp.toLocaleString()} XP
      </span>
    </div>
  );
}