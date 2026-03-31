import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "../store/notification.store";
import { deleteNotificationApi } from "../api/notification.api";
import { notificationKeys } from "../queries/notification.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

/**
 * Soft-delete a personal notification.
 * Optimistic: disappears from the inbox immediately.
 */
export function useDeleteNotification() {
  const qc = useQueryClient();
  const optimisticallyDelete = useNotificationStore(
    (s) => s.optimisticallyDelete,
  );

  return useMutation({
    mutationFn: (id: string) => deleteNotificationApi(id),

    onMutate: (id) => {
      optimisticallyDelete(id);
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.summary() });
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        toast.error("Notification not found or does not belong to you.");
      } else {
        toast.error("Failed to delete notification.");
      }
    },
  });
}
