import { Search, X } from "lucide-react";

export function SearchOverlay({
  isOpen,
  onClose,
  searchRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-150">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1117]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search challenges, events, teams…"
              className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-slate-600 outline-none"
            />
            <button
              onClick={onClose}
              className="rounded-lg border border-white/[0.07] p-1 text-slate-600 transition-colors hover:text-slate-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-4 py-6 text-center">
            <p className="font-mono text-xs text-slate-700">
              Type to search across the platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}