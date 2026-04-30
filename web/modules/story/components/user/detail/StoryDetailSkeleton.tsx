export function StoryDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero */}
      <div className="mb-10 h-48 rounded-3xl bg-white/[0.03]" />
      {/* Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-2xl bg-white/[0.03]" />
          <div className="h-40 rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}