import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGetChallengeSubmissionsApi } from "../../api/challenges.api";
import { challengeKeys } from "../../queries/challenge.keys";

export function useAdminChallengeSubmissions(
  challengeId: string,
  page = 1,
  isCorrect?: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: challengeKeys.admin.submissions(challengeId, page),
    queryFn: () =>
      adminGetChallengeSubmissionsApi(challengeId, page, 20, isCorrect),
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 15, // 15s — submissions are time-sensitive
    placeholderData: keepPreviousData,
  });
}
