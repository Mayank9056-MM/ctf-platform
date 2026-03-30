import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/queries/dashboard.keys";
import { useQuery } from "@tanstack/react-query";
import { getMyTeamApi } from "../api/team.api";
import { DASHBOARD_STALE_TIMES } from "@/modules/dashboard/constants/dashboard.constant";

/**
 * Hook to fetch the current user's team.
 *
 * This hook returns a react-query hook containing the team data.
 * The query is cached for DASHBOARD_STALE_TIMES.team milliseconds.
 * If the API call fails with a 404 status code, the hook will not retry.
 *
 * @returns A react-query hook containing the team data.
 */
export function useMyTeam() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.myTeam,
    queryFn: getMyTeamApi,
    staleTime: DASHBOARD_STALE_TIMES.team,
    retry: false, // 404 is valid: user has no team yet
  });
}
