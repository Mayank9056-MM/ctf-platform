import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnnouncementStore } from "../store/annoucement.store";
import { dismissAnnouncementApi } from "../api/announcement.api";
import { announcementKeys } from "../queries/announcement.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

/**
 * Dismiss an announcement.
 * Uses optimistic update: the announcement disappears from the UI immediately,
 * before the server confirms. If the request fails, the optimistic state
 * is NOT reversed (dismiss failures are non-critical — the server state
 * will correct itself on the next feed fetch).
 */
export function useDismissAnnouncement() {
  const qc = useQueryClient();
  const optimisticDismiss = useAnnouncementStore((s) => s.optimisticDismiss);

  return useMutation({
    mutationFn: (id: string) => dismissAnnouncementApi(id),

    onMutate: (id) => {
      // Optimistic: add to dismissed set immediately
      optimisticDismiss(id);
    },

    onSuccess: () => {
      // Invalidate to sync server dismiss state on next staleTime expiry
      qc.invalidateQueries({ queryKey: announcementKeys.feeds() });
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 404) {
        // Already expired or deleted — treat as success silently
        qc.invalidateQueries({ queryKey: announcementKeys.feeds() });
      } else {
        toast.error(
          "Could not dismiss announcement. It may have already expired.",
        );
      }
    },
  });
}
