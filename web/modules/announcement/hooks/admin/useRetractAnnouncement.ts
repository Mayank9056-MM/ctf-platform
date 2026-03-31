import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RetractAnnouncementPayload } from "../../types/announcement.types";
import { adminRetractAnnouncementApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

/**
 * Retract — hides from participants, preserves the record.
 * Retracted announcements cannot be re-published or edited.
 */
export function useRetractAnnouncement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: RetractAnnouncementPayload;
    }) => adminRetractAnnouncementApi(id, payload),

    onSuccess: (announcement) => {
      qc.setQueryData(
        announcementKeys.admin.detail(announcement._id),
        announcement,
      );
      qc.invalidateQueries({ queryKey: announcementKeys.admin.lists() });
      // Retracted announcements no longer appear in the player feed
      qc.invalidateQueries({ queryKey: announcementKeys.feeds() });

      toast.success(
        `"${announcement.title}" retracted from the participant feed.`,
      );
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error("This announcement is already retracted.");
      } else if (status === 404) {
        toast.error("Announcement not found.");
      } else {
        toast.error(err.message ?? "Failed to retract announcement.");
      }
    },
  });
}
