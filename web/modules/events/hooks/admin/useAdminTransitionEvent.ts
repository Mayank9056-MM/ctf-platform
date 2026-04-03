import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { EventStatus } from "../../types/event.type";
import { adminTransitionEventApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Transition event status. Validates the allowed next statuses
 * client-side (from STATUS_TRANSITIONS) before hitting the server.
 */
export function useAdminTransitionEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) => {
      return adminTransitionEventApi(id, status);
    },

    onSuccess: (event) => {
      qc.setQueryData(eventKeys.detail(event._id), event);
      qc.setQueryData(eventKeys.detail(event.slug), event);
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      // When an event goes active/ended, the public list needs to update too
      qc.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success(`Event transitioned to "${event.status}".`);
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("challenge")) {
          toast.error(
            "Cannot activate: event has no challenges. Add at least one first.",
          );
        } else if (msg.includes("transition")) {
          toast.error(`Status transition not allowed. ${err.message}`);
        } else {
          toast.error(err.message ?? "Invalid transition.");
        }
      } else if (status === 404) {
        toast.error("Event not found.");
      } else {
        toast.error(err.message ?? "Transition failed.");
      }
    },
  });
}
