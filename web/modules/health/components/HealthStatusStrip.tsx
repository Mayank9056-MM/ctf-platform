// Compact status strip (for dashboard header)

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useServiceStatusSummary } from "../hooks/useServiceStatusSummary";
import { SERVICE_LABELS, STATUS_CONFIG } from "../constants/health.constants";
import { fmt } from "@/shared/utils/fmt";
import { cn } from "@/lib/utils";
import { ServiceStatus } from "../types/health-check.types";

/**
 * Tiny inline strip showing 6 service dots.
 * Drop this anywhere — it only fetches if user is superadmin.
 */
export function HealthStatusStrip() {
  const user = useAuthStore((s) => s.user);
  const summary = useServiceStatusSummary();

  if (user?.role !== "superadmin" || summary.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5" title="Platform health">
      {summary.map((s) => {
        const sc = STATUS_CONFIG[s.status];
        return (
          <div
            key={s.name}
            title={`${SERVICE_LABELS[s.name]}: ${sc.label} (${fmt(s.latencyMs)})`}
            className={cn(
              "h-2 w-2 rounded-full",
              sc.dot,
              s.status !== ServiceStatus.HEALTHY && "animate-pulse",
            )}
          />
        );
      })}
    </div>
  );
}