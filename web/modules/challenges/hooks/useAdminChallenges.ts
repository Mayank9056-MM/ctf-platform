import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGetChallengesApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";
import { ChallengeFilters } from "../types/challenge.types";

export function useAdminChallenges(filters: ChallengeFilters = {}) {
  return useQuery({
    queryKey: challengeKeys.admin.list(filters),
    queryFn: () => adminGetChallengesApi(filters),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}