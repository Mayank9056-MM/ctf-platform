import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { CreateEventPayload } from "../../types/event.type";
import { adminCreateEventApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Create a new event. Always saved as draft.
 * Transition to "scheduled" when ready using useAdminTransitionEvent.
 */
export function useAdminCreateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => adminCreateEventApi(payload),

    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      toast.success(`"${event.name}" created as draft.`, {
        description: "Configure and publish when ready.",
      });
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error("An event with this name already exists.");
      } else if (status === 400) {
        toast.error(err.message ?? "Invalid event data.");
      } else {
        toast.error(err.message ?? "Failed to create event.");
      }
    },
  });
}
