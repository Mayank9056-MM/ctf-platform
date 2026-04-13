import { Megaphone } from "lucide-react";

export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.05]">
        <Megaphone className="h-8 w-8 text-slate-700" />
      </div>
      <p className="font-mono text-sm font-medium text-slate-500">
        {filtered ? "No announcements match this filter" : "Comms channel is quiet"}
      </p>
      <p className="mt-1.5 max-w-[220px] text-xs text-slate-700 leading-relaxed">
        {filtered
          ? "Try a different severity filter"
          : "Important platform updates and event alerts will appear here"}
      </p>
    </div>
  );
}