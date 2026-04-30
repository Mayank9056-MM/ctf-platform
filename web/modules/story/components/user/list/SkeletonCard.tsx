export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e15]/80 overflow-hidden animate-pulse">
      <div className="h-44 bg-white/[0.03]" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
        <div className="h-3 w-full rounded bg-white/[0.04]" />
        <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
      </div>
      <div className="border-t border-white/[0.04] px-5 py-3">
        <div className="h-3 w-1/3 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}
