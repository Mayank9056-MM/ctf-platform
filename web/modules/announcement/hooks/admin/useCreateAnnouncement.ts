import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateAnnouncementPayload } from "../../types/announcement.types";
import { adminCreateAnnouncementApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useCreateAnnouncement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      adminCreateAnnouncementApi(payload),

    onSuccess: (announcement) => {
      qc.invalidateQueries({ queryKey: announcementKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: announcementKeys.admin.stats() });

      if (announcement.isPublished) {
        toast.success(
          `"${announcement.title}" published to ${announcement.audience} audience.`,
        );
        // Invalidate player feed so the new announcement appears
        qc.invalidateQueries({ queryKey: announcementKeys.feeds() });
      } else {
        toast.success(`"${announcement.title}" saved as draft.`, {
          description: "Publish when ready to notify participants.",
        });
      }
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        toast.error(err.message ?? "Invalid announcement data.");
      } else if (status === 404) {
        toast.error("One or more targetUsers not found.");
      } else {
        toast.error(err.message ?? "Failed to create announcement.");
      }
    },
  });
}
