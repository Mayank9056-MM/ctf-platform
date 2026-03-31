import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminDispatchPayload } from "../../types/notification.types";
import { adminDispatchNotificationApi } from "../../api/notification.api";
import { notificationKeys } from "../../queries/notification.keys";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

/**
 * Admin dispatch — send targeted or broadcast notification.
 * recipientId: null / omit = broadcast to all users.
 */
export function useAdminDispatchNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminDispatchPayload) =>
      adminDispatchNotificationApi(payload),

    onSuccess: (notification) => {
      qc.invalidateQueries({ queryKey: notificationKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: notificationKeys.admin.stats() });

      const isBroadcast = notification.recipient === null;

      toast.success(
        isBroadcast
          ? "Broadcast notification sent to all users."
          : `Notification sent to user.`,
        {
          description: notification.title,
        },
      );
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 404) {
        toast.error("Recipient user not found.");
      } else if (status === 400) {
        toast.error(err.message ?? "Invalid notification data.");
      } else {
        toast.error(err.message ?? "Failed to dispatch notification.");
      }
    },
  });
}
