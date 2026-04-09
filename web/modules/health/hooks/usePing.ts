import { useQuery } from "@tanstack/react-query";
import { healthKeys } from "../queries/health-check.queries";
import { pingApi } from "../api/health-check.api";

/**
 * Lightweight liveness probe — public, no auth required.
 * Useful for confirming the API process is reachable at all before rendering
 * the full health panel.
 */
export function usePing() {
  return useQuery({
    queryKey: healthKeys.ping(),
    queryFn: pingApi,
    // Ping every 15s
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 1,
  });
}
