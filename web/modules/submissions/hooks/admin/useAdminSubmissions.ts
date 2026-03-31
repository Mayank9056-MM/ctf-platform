import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGetSubmissionsApi } from "../../api/submissons.api";
import { submissionKeys } from "../../queries/submissions.query";
import { useSubmissionStore } from "../../store/submissions.store";
import { AdminSubmissionsFilters } from "../../types/submission.types";

/**
 * Platform-wide paginated submission log.
 * Reads filters from Zustand store.
 */
export function useAdminSubmissions(override?: AdminSubmissionsFilters) {
  const storeFilters = useSubmissionStore((s) => s.adminFilters);
  const filters = override ?? storeFilters;

  return useQuery({
    queryKey: submissionKeys.admin.list(filters),
    queryFn: () => adminGetSubmissionsApi(filters),
    staleTime: 1000 * 15, // 15s — submissions are time-sensitive during events
    placeholderData: keepPreviousData,
  });
}
