import { notificationKeys } from "@/modules/notification/queries/notification.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { submissionKeys } from "../../queries/submissions.query";
import { adminDeleteSubmissionApi } from "../../api/submissons.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Delete a submission and reverse its points award.
 * Cascades score changes to user + team. Superadmin only.
 *
 * Invalidates:
 *   - Admin submission list (entry removed)
 *   - Challenge detail (solveCount, firstBlood may change)
 *   - My stats (if the deleted submission belongs to a user viewing their stats)
 *   - Notification summary (score change triggers score_updated notification)
 */
export function useAdminDeleteSubmission() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      adminDeleteSubmissionApi(submissionId),

    onSuccess: (_, submissionId) => {
      // Remove from detail cache — stale detail shouldn't flash
      qc.removeQueries({
        queryKey: submissionKeys.admin.detail(submissionId),
      });
      qc.invalidateQueries({ queryKey: submissionKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: submissionKeys.admin.stats({}) });

      // Challenge detail may have changed (solveCount, firstBlood)
      qc.invalidateQueries({ queryKey: ["challenges"] });

      // Score-related caches
      qc.invalidateQueries({ queryKey: submissionKeys.myStats() });
      qc.invalidateQueries({ queryKey: notificationKeys.summary() });

      toast.success("Submission deleted and points reversed.", {
        description: "Score changes have been applied to the user and team.",
      });
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 404) {
        toast.error("Submission not found.");
      } else if (status === 403) {
        toast.error("Only superadmins can delete submissions.");
      } else {
        toast.error(err.message ?? "Failed to delete submission.");
      }
    },
  });
}
