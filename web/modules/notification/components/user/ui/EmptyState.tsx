import { BellOff } from "lucide-react";

export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.05]">
        <BellOff className="h-8 w-8 text-slate-700" />
      </div>
      <p className="font-mono text-sm font-medium text-slate-500">
        {filtered
          ? "No notifications match this filter"
          : "Intel feed is empty"}
      </p>
      <p className="mt-1.5 max-w-[240px] text-xs text-slate-700 leading-relaxed">
        {filtered
          ? "Try a different filter or check back later"
          : "Solve challenges, join teams, and participate in events to receive notifications"}
      </p>
    </div>
  );
}