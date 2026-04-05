import { useUser } from "@/modules/auth/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { leaderboardKeys } from "../queries/leaderboard.queries";
import { getMyRankApi } from "./leaderboard.api";
import { REFETCH_INTERVALS, STALE } from "../constants/leaderboard.constants";

/**
 * Hook to fetch the current user's rank in the global leaderboard.
 * @param {boolean} enabled Whether to enable the hook.
 * @returns {UseQueryResult<MyRankResponse>} The result of the query.
 */
export function useMyRank(enabled = true) {
  const user = useUser();

  return useQuery({
    queryKey: leaderboardKeys.myRank(),
    queryFn: getMyRankApi,
    enabled: enabled && !!user,
    staleTime: STALE.MY_RANK,
    refetchInterval: REFETCH_INTERVALS.GLOBAL,
    refetchIntervalInBackground: false,
  });
}
