import { useQuery } from "@tanstack/react-query";
import { adminGetSubmissionStatsApi } from "../../api/submissons.api";
import { submissionKeys } from "../../queries/submissions.query";
import { useSubmissionStore } from "../../store/submissions.store";
import { AdminStatsFilters } from "../../types/submission.types";

/**
 * Aggregate analytics stats — by category, top solvers, activity chart.
 * Reads stats filters from Zustand store.
 */
export function useAdminSubmissionStats(override?: AdminStatsFilters) {
  const storeFilters = useSubmissionStore((s) => s.adminStatsFilters);
  const filters = override ?? storeFilters;

  return useQuery({
    queryKey: submissionKeys.admin.stats(filters),
    queryFn: () => adminGetSubmissionStatsApi(filters),
    staleTime: 1000 * 60, // 1 min — stats are slightly less urgent
  });
}
