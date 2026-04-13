/**
 * A loading skeleton for the Challenge detail page.
 *
 * Contains a mix of different skeleton elements to create a visually appealing loading state.
 *
 * @returns A JSX element containing the skeleton.
 */
export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 space-y-6 lg:space-y-0">
        <div className="space-y-5">
          <div className="h-6 w-24 animate-pulse rounded bg-white/[0.05]" />
          <div className="flex gap-5">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/[0.06]" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-white/[0.07]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
          <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}