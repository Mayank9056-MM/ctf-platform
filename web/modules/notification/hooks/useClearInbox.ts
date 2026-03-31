import { toast } from "sonner";
import { notificationKeys } from "../queries/notification.keys";
import { clearInboxApi } from "../api/notification.api";
import { useNotificationStore } from "../store/notification.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Bulk soft-delete all personal notifications.
 * Broadcasts are excluded — use dismiss for those.
 */
export function useClearInbox() {
  const qc = useQueryClient();
  const clearOptimistic = useNotificationStore((s) => s.clearOptimistic);

  return useMutation({
    mutationFn: clearInboxApi,

    onSuccess: (result) => {
      // Clear optimistic sets — server is now the truth
      clearOptimistic();
      qc.invalidateQueries({ queryKey: notificationKeys.summary() });
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      toast.success(
        `Inbox cleared — ${result.cleared} notification${result.cleared !== 1 ? "s" : ""} removed.`,
      );
    },

    onError: () => {
      toast.error("Failed to clear inbox.");
    },
  });
}
