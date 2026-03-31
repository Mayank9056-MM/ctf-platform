import { ApiError } from "next/dist/server/api-utils";
import { notificationKeys } from "../queries/notification.keys";
import { toast } from "sonner";
import { dismissNotificationApi } from "../api/notification.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "../store/notification.store";

/**
 * Dismiss a broadcast notification.
 * Optimistic: disappears from UI immediately via the Zustand set.
 * Non-critical: if server fails, the item stays dismissed in the UI
 * and will re-appear on the next fresh fetch.
 */
export function useDismissNotification() {
  const qc = useQueryClient();
  const optimisticallyDismiss = useNotificationStore(
    (s) => s.optimisticallyDismiss
  );
 
  return useMutation({
    mutationFn: (id: string) => dismissNotificationApi(id),
 
    onMutate: (id) => {
      // Optimistic: hide immediately
      optimisticallyDismiss(id);
    },
 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.summary() });
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        // Already expired/deleted — silently re-sync
        qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      } else {
        toast.error("Could not dismiss notification.");
      }
    },
  });
}