export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
      <div className="h-6 w-24 animate-pulse rounded bg-white/[0.05]" />
      <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 flex gap-5">
        <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/[0.07]" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-1/3 animate-pulse rounded bg-white/[0.07]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-white/[0.05]" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-white/[0.04]"
          />
        ))}
      </div>
    </div>
  );
}
