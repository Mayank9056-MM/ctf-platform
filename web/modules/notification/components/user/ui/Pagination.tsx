import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  meta,
  page,
  setPage,
}: {
  meta: {
    hasPrev: boolean;
    hasNext: boolean;
    page: number;
    totalPages: number;
  };
  page: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <button
        onClick={() => setPage(page - 1)}
        disabled={!meta.hasPrev}
        className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Previous
      </button>
      <span className="font-mono text-[11px] text-slate-700">
        {meta.page} / {meta.totalPages}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!meta.hasNext}
        className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
