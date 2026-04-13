import { RefreshCw, Shield } from "lucide-react";

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.05]">
        <Shield className="h-8 w-8 text-slate-700" />
      </div>
      <p className="font-mono text-sm font-medium text-slate-500">
        No missions match
      </p>
      <p className="mt-1.5 text-xs text-slate-700">
        Adjust your filters to find available challenges
      </p>
      <button
        onClick={onReset}
        className="mt-5 flex items-center gap-1.5 rounded-xl border border-white/[0.07] px-4 py-2 font-mono text-xs text-slate-500 hover:border-white/[0.12] hover:text-slate-300 transition-all"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Clear filters
      </button>
    </div>
  );
}
