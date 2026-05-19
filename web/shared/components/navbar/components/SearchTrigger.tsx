import { Command, Search } from "lucide-react";

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-600 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-slate-400 xl:flex"
      aria-label="Search (Ctrl+K)"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="font-mono text-xs">Search…</span>
      <kbd className="ml-1 flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}
