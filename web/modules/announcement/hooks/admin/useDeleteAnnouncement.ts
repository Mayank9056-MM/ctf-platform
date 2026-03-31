import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDeleteAnnouncementApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

/**
 * Hard delete. Superadmin only.
 * Prefer retract for routine operations — this is irreversible.
 */
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (id: string) => adminDeleteAnnouncementApi(id),
 
    onSuccess: (_, id) => {
      // Remove from detail cache
      qc.removeQueries({ queryKey: announcementKeys.admin.detail(id) });
      qc.invalidateQueries({ queryKey: announcementKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: announcementKeys.admin.stats() });
      qc.invalidateQueries({ queryKey: announcementKeys.feeds() });
 
      toast.success("Announcement permanently deleted.");
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        toast.error("Announcement not found.");
      } else {
        toast.error(err.message ?? "Failed to delete announcement.");
      }
    },
  });
}