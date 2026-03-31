import { useQuery } from "@tanstack/react-query";
import { adminGetSubmissionByIdApi } from "../../api/submissons.api";
import { submissionKeys } from "../../queries/submissions.query";

/**
 * Full submission detail — includes IP address and user agent.
 * Only fetches when a submission is selected.
 */
export function useAdminSubmissionById(id: string | null, enabled = true) {
  return useQuery({
    queryKey: submissionKeys.admin.detail(id ?? ""),
    queryFn: () => adminGetSubmissionByIdApi(id!),
    enabled: enabled && !!id,
    staleTime: 1000 * 60,
  });
}
