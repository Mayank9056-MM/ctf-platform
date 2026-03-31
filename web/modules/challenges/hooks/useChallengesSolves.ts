import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getChallengeSolvesApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";

export function useChallengeSolves(
  challengeId: string,
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: challengeKeys.solves(challengeId, page),
    queryFn: () => getChallengeSolvesApi(challengeId, page),
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 30, // 30s — solves appear in real-time during events
    placeholderData: keepPreviousData,
  });
}
