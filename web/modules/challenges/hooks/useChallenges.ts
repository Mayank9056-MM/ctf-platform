import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getChallengesApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";
import { ChallengeFilters } from "../types/challenge.types";

/**
 * Paginated challenge list for the player challenge board.
 *
 * - staleTime: 60s  — the list doesn't change mid-session unless a solve happens
 * - placeholderData: keeps the previous page visible while the next page loads
 *   (prevents layout shift on filter/page changes)
 * - keepPreviousData: true  — filter changes show old data until new data arrives
 */
export function useChallenges(filters: ChallengeFilters = {}) {
  return useQuery({
    queryKey: challengeKeys.list(filters),
    queryFn: () => getChallengesApi(filters),
    staleTime: 1000 * 60, // 1 min
    placeholderData: keepPreviousData,
  });
}