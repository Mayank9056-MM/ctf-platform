import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

 
export function Pagination({ meta, page, setPage }: {
  meta: { hasPrev: boolean; hasNext: boolean; page: number; totalPages: number };
  page: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={!meta.hasPrev}
        className="font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30">
        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
      </Button>
      <span className="font-mono text-[11px] text-slate-700">{meta.page} / {meta.totalPages}</span>
      <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={!meta.hasNext}
        className="font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30">
        Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}