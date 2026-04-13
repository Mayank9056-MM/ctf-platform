import { toast } from "sonner";
import { notificationKeys } from "../queries/notification.keys";
import { markNotificationsReadApi } from "../api/notification.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Mark specific notifications as read, or mark all if IDs are omitted.
 * Invalidates summary (bell badge) and inbox list immediately.
 */
export function useMarkNotificationsAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids?: string[]) => markNotificationsReadApi(ids),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.summary() });
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
    },

    onError: () => {
      toast.error("Failed to mark notification(s) as read.");
    },
  });
}
