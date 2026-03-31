import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getChallengeSolvesApi } from "../api/submissons.api";
import { submissionKeys } from "../queries/submissions.query";

/**
 * Public solve leaderboard for a challenge, sorted oldest-first.
 * No auth required.
 */
export function useChallengeSolves(
  challengeId: string,
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: submissionKeys.solves(challengeId, page),
    queryFn: () => getChallengeSolvesApi(challengeId, page),
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}
