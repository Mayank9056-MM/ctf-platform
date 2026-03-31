import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMySubmissionsApi } from "../api/submissons.api";
import { submissionKeys } from "../queries/submissions.query";
import { useMySubmissionsState } from "../store/submissions.store";
import { MySubmissionsFilters } from "../types/submission.types";

/**
 * Paginated list of the player's own submissions.
 * Reads filters from Zustand store — filter controls bind to the store.
 */
export function useMySubmissions(override?: MySubmissionsFilters) {
  const { page, isCorrectFilter, challengeIdFilter, sortOrder } =
    useMySubmissionsState();

  const filters: MySubmissionsFilters = override ?? {
    page,
    limit: 20,
    ...(isCorrectFilter !== "all" && { isCorrect: isCorrectFilter }),
    ...(challengeIdFilter && { challengeId: challengeIdFilter }),
    sortOrder,
  };

  return useQuery({
    queryKey: submissionKeys.myList(filters),
    queryFn: () => getMySubmissionsApi(filters),
    staleTime: 1000 * 30, // 30s — submissions only change when user submits
    placeholderData: keepPreviousData,
  });
}
