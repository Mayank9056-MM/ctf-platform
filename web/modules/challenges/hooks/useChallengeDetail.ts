import { useQuery } from "@tanstack/react-query";
import { getChallengeDetailApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";

export function useChallengeDetail(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: challengeKeys.detail(idOrSlug),
    queryFn: () => getChallengeDetailApi(idOrSlug),
    enabled: enabled && !!idOrSlug,
    staleTime: 1000 * 60, // 1 min
    refetchOnWindowFocus: true,
  });
}
