import { useQuery } from "@tanstack/react-query";
import { challengeKeys } from "../../queries/challenge.keys";
import { adminGetChallengeStatsApi } from "../../api/challenges.api";

export function useAdminChallengeStats() {
  return useQuery({
    queryKey: challengeKeys.admin.stats(),
    queryFn: adminGetChallengeStatsApi,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
