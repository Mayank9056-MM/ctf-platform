import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { adminAddChallengesApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Add challenges to an event (additive — does not replace).
 * Updates event detail cache directly.
 */
export function useAdminAddChallenges(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (challengeIds: string[]) =>
      adminAddChallengesApi(eventId, challengeIds),

    onSuccess: (event) => {
      qc.setQueryData(eventKeys.detail(event._id), event);
      qc.setQueryData(eventKeys.detail(event.slug), event);
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      toast.success(`${event.challenges.length} challenges now in event.`);
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("inactive") || msg.includes("not exist")) {
          toast.error("One or more challenges not found or inactive.");
        } else if (msg.includes("already")) {
          toast.error("All selected challenges are already in this event.");
        } else {
          toast.error(err.message ?? "Could not add challenges.");
        }
      } else if (status === 409) {
        toast.error("Cannot modify challenges on an ended or archived event.");
      } else {
        toast.error(err.message ?? "Failed to add challenges.");
      }
    },
  });
}
