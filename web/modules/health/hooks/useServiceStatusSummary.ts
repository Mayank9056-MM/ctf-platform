import { ServiceStatus, ValidService } from "../types/health-check.types";
import { useHealthCheck } from "./useHealthCheck";

/**
 * Derived hook — returns a flat array of { name, status, latencyMs }
 * sorted: unhealthy first, degraded second, healthy last.
 * Useful for the compact status strip in the dashboard header.
 */
export function useServiceStatusSummary() {
  const { data } = useHealthCheck();

  if (!data) return [];

  const ORDER: Record<ServiceStatus, number> = {
    [ServiceStatus.UNHEALTHY]: 0,
    [ServiceStatus.DEGRADED]: 1,
    [ServiceStatus.HEALTHY]: 2,
  };

  return (
    Object.entries(data.services) as [
      ValidService,
      (typeof data.services)[ValidService],
    ][]
  )
    .map(([name, check]) => ({
      name,
      status: check.status,
      latencyMs: check.latencyMs,
      message: check.message,
      checkedAt: check.checkedAt,
    }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
}
