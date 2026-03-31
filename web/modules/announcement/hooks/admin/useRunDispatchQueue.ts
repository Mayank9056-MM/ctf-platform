import { ApiError } from "next/dist/server/api-utils";
import { adminRunDispatchQueueApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Manually trigger the dispatch queue. Superadmin only.
 * Shows a summary toast with how many were processed.
 */
export function useRunDispatchQueue() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: adminRunDispatchQueueApi,

    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: announcementKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: announcementKeys.admin.stats() });

      if (result.failed > 0) {
        toast.warning(
          `Dispatch complete: ${result.processed} sent, ${result.failed} failed.`,
          { description: "Check server logs for failed dispatches." },
        );
      } else if (result.processed === 0) {
        toast.info("No pending announcements to dispatch.");
      } else {
        toast.success(
          `Dispatched ${result.processed} announcement${result.processed !== 1 ? "s" : ""}.`,
        );
      }
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Dispatch queue failed.");
    },
  });
}
