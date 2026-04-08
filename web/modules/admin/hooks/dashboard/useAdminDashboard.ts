import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "../../queries/admin.queries";
import { getDashboardStatsApi } from "../../api/admin.api";

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: getDashboardStatsApi,
    staleTime: 1000 * 60 * 2, // 2 min
    refetchInterval: 1000 * 60 * 5, // background refresh every 5 min
    refetchIntervalInBackground: false,
  });
}
