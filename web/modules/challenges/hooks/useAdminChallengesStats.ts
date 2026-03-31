import { useQuery } from "@tanstack/react-query";
import { adminGetChallengeStatsApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";

export function useAdminChallengeStats() {
  return useQuery({
    queryKey: challengeKeys.admin.stats(),
    queryFn: adminGetChallengeStatsApi,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
