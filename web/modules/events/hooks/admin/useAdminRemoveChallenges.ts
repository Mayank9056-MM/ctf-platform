import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { adminRemoveChallengesApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Remove challenges from an event.
 */
export function useAdminRemoveChallenges(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (challengeIds: string[]) =>
      adminRemoveChallengesApi(eventId, challengeIds),

    onSuccess: (event) => {
      qc.setQueryData(eventKeys.detail(event._id), event);
      qc.setQueryData(eventKeys.detail(event.slug), event);
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      toast.success("Challenges removed from event.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        toast.error("None of the selected challenges are in this event.");
      } else if (status === 409) {
        toast.error("Cannot modify challenges on an ended or archived event.");
      } else {
        toast.error(err.message ?? "Failed to remove challenges.");
      }
    },
  });
}
