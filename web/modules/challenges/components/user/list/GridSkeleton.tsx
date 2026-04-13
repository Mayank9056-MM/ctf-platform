export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 space-y-3"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="space-y-1">
              <div className="h-2 w-12 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-2 w-16 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
          <div className="h-px bg-white/[0.05]" />
          <div className="flex justify-between">
            <div className="h-5 w-12 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-4 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}