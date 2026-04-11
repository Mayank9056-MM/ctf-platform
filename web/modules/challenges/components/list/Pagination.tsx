import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  meta,
  page,
  onPage,
}: {
  meta: {
    hasPrev: boolean;
    hasNext: boolean;
    page: number;
    totalPages: number;
    total: number;
  };
  page: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={!meta.hasPrev}
        className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Previous
      </button>
      <div className="text-center">
        <span className="font-mono text-xs text-slate-600">
          Page {meta.page} of {meta.totalPages}
        </span>
        <p className="font-mono text-[10px] text-slate-800">
          {meta.total} challenges
        </p>
      </div>
      <button
        onClick={() => onPage(page + 1)}
        disabled={!meta.hasNext}
        className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}