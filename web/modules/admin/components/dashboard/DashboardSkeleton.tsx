
import { cn } from "@/lib/utils";

/**
 * A loading skeleton component.
 *
 * @param {string} [className] - Additional CSS classes to apply to the component.
 *
 * @returns A JSX element containing the skeleton.
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-800/50", className)}
    />
  );
}


// Loading Skeleton

/**
 * A loading skeleton for the admin dashboard page.
 *
 * Contains a mix of different skeleton elements to create a visually appealing loading state.
 *
 * @returns A JSX element containing the skeleton.
 */
export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}