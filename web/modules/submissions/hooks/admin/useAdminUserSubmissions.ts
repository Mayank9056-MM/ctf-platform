import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGetUserSubmissionsApi } from "../../api/submissons.api";
import { submissionKeys } from "../../queries/submissions.query";

/**
 * All submissions for a specific user — used on the admin user detail page.
 */
export function useAdminUserSubmissions(
  userId: string,
  page = 1,
  isCorrect?: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: submissionKeys.admin.userList(userId, page),
    queryFn: () => adminGetUserSubmissionsApi(userId, page, 20, isCorrect),
    enabled: enabled && !!userId,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}
