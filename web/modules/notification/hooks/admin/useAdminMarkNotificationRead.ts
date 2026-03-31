import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { notificationKeys } from "../../queries/notification.keys";
import { adminMarkNotificationReadApi } from "../../api/notification.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Mark a specific notification as read on behalf of a user (support ops).
 */
export function useAdminMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminMarkNotificationReadApi(id),

    onSuccess: (notification) => {
      qc.setQueryData(
        notificationKeys.admin.detail(notification._id),
        notification,
      );
      qc.invalidateQueries({ queryKey: notificationKeys.admin.lists() });
      toast.success("Notification marked as read.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 400) {
        toast.error(
          "Broadcast notifications cannot be marked as read — use dismiss instead.",
        );
      } else {
        toast.error(err.message ?? "Failed to mark as read.");
      }
    },
  });
}
