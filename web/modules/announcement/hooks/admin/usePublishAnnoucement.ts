import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPublishAnnouncementApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

/**
 * Publish a draft. Idempotent — re-publishing doesn't re-dispatch notifications.
 * Invalidates the player feed so participants see it immediately.
 */
export function usePublishAnnouncement() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (id: string) => adminPublishAnnouncementApi(id),
 
    onSuccess: (announcement) => {
      qc.setQueryData(announcementKeys.admin.detail(announcement._id), announcement);
      qc.invalidateQueries({ queryKey: announcementKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: announcementKeys.feeds() });
 
      toast.success(`"${announcement.title}" is now live for participants.`, {
        description: `Audience: ${announcement.audience}`,
      });
    },
 
    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error("This announcement has been retracted and cannot be published.");
      } else if (status === 404) {
        toast.error("Announcement not found.");
      } else {
        toast.error(err.message ?? "Failed to publish announcement.");
      }
    },
  });
}