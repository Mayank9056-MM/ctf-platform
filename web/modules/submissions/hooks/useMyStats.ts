import { useQuery } from "@tanstack/react-query";
import { submissionKeys } from "../queries/submissions.query";
import { getMyStatsApi } from "../api/submissons.api";

/**
 * Player's own stats — score, rank, streak, solve rate, 30-day activity.
 * Polled every 60s so rank updates are reflected without refresh.
 */
export function useMyStats() {
  return useQuery({
    queryKey: submissionKeys.myStats(),
    queryFn: getMyStatsApi,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // background refresh every minute
    refetchIntervalInBackground: false,
  });
}
