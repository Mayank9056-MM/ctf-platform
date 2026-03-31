import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { notificationKeys } from "../../queries/notification.keys";
import { adminDeleteNotificationApi } from "../../api/notification.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hard-delete. Superadmin only. Irreversible.
 */
export function useAdminDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeleteNotificationApi(id),

    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: notificationKeys.admin.detail(id) });
      qc.invalidateQueries({ queryKey: notificationKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: notificationKeys.admin.stats() });
      toast.success("Notification permanently deleted.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        toast.error("Notification not found.");
      } else {
        toast.error(err.message ?? "Failed to delete notification.");
      }
    },
  });
}
