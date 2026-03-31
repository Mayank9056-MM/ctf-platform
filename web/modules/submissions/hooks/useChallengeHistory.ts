import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getChallengeHistoryApi } from "../api/submissons.api";
import { submissionKeys } from "../queries/submissions.query";

/**
 * Own attempt history for a single challenge.
 * Used on the challenge detail page to show past attempts.
 * Only fetches when the challenge detail is visible.
 */
export function useChallengeHistory(
  challengeId: string,
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: submissionKeys.history(challengeId, page),
    queryFn: () => getChallengeHistoryApi(challengeId, page),
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}
