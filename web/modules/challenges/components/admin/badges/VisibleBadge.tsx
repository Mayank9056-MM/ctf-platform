import { Eye, EyeOff } from "lucide-react";

export function VisibleBadge({ visible }: { visible: boolean }) {
  return visible ? (
    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400 ring-1 ring-emerald-500/20">
      <Eye className="h-2.5 w-2.5" />
      Live
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-slate-700/40 px-2 py-0.5 font-mono text-[10px] text-slate-500 ring-1 ring-slate-700/50">
      <EyeOff className="h-2.5 w-2.5" />
      Draft
    </span>
  );
}