import { useQuery } from "@tanstack/react-query";
import { getServiceHealthApi } from "../api/health-check.api";
import { healthKeys } from "../queries/health-check.queries";
import { ValidService } from "../types/health-check.types";

/**
 * Drill-down check for a single named service.
 * Only fires when a service is explicitly selected (enabled: !!service).
 * Superadmin only.
 */
export function useServiceHealth(service: ValidService | null) {
  return useQuery({
    queryKey: healthKeys.service(service as ValidService),
    queryFn: () => getServiceHealthApi(service as ValidService),
    enabled: !!service,
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: (failureCount, err: unknown) => {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
