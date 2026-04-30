import { BookOpen } from "lucide-react";

export function EmptyState({ search }: { search: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <BookOpen className="h-8 w-8 text-slate-700" />
      </div>
      <p className="font-mono text-sm font-medium text-slate-500">
        {search ? `No stories matching "${search}"` : "No stories found"}
      </p>
      <p className="mt-1 font-mono text-xs text-slate-700">
        Try adjusting your filters
      </p>
    </div>
  );
}
