import { toast } from "sonner";
import { getHealthApi } from "../api/health-check.api";
import { healthKeys } from "../queries/health-check.queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAutoRefresh,
  useHealthCheckStore,
  useRefreshInterval,
} from "../store/health-check.store";

/**
 * Full platform health report.
 * Superadmin only — the hook silently disables refetching if the user receives
 * a 401/403 so we don't spam the backend.
 *
 * Auto-refresh interval is driven by the Zustand store so the user can
 * change it from the UI without remounting the component.
 */
export function useHealthCheck() {
  const autoRefresh = useAutoRefresh();
  const intervalMs = useRefreshInterval();
  const markFetched = useHealthCheckStore((s) => s.markFetched);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: healthKeys.full(),
    queryFn: async () => {
      const data = await getHealthApi();
      markFetched();
      return data;
    },
    // Only auto-refresh if the store says so
    refetchInterval: autoRefresh ? intervalMs : false,
    refetchIntervalInBackground: false,
    staleTime: intervalMs / 2,
    // Don't retry on auth errors — the role guard in the UI will handle this
    retry: (failureCount, err: unknown) => {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    // Surface degraded/unhealthy as toasts on background refetches
    meta: {
      onSuccess: (data: Awaited<ReturnType<typeof getHealthApi>>) => {
        if (data.status === "unhealthy") {
          toast.error("Platform health: UNHEALTHY", {
            id: "health-unhealthy",
            description: "One or more critical services are down.",
            duration: 8_000,
          });
        } else if (data.status === "degraded") {
          toast.warning("Platform health: DEGRADED", {
            id: "health-degraded",
            description: "Some services are running slowly.",
            duration: 6_000,
          });
        }
      },
    },
  });

  /**
   * Manually refresh both the full check and any open service drill-down.
   */
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: healthKeys.full() });
  };

  return {
    ...query,
    refresh,
    // Derived convenience flags
    isHealthy: query.data?.status === "healthy",
    isDegraded: query.data?.status === "degraded",
    isUnhealthy: query.data?.status === "unhealthy",
  };
}
