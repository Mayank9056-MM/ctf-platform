import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateAnnouncementPayload } from "../../types/announcement.types";
import { adminUpdateAnnouncementApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useUpdateAnnouncement(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAnnouncementPayload) =>
      adminUpdateAnnouncementApi(id, payload),

    onSuccess: (announcement) => {
      // Update detail cache directly — avoids a re-fetch
      qc.setQueryData(announcementKeys.admin.detail(id), announcement);
      qc.invalidateQueries({ queryKey: announcementKeys.admin.lists() });

      toast.success("Announcement updated.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error("Retracted announcements cannot be edited.");
      } else if (status === 404) {
        toast.error("Announcement not found.");
      } else {
        toast.error(err.message ?? "Failed to update announcement.");
      }
    },
  });
}
