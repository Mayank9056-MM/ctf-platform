import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { UpdateEventPayload } from "../../types/event.type";
import { adminUpdateEventApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Update event fields. Updates both admin list and detail caches.
 */
export function useAdminUpdateEvent(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEventPayload) =>
      adminUpdateEventApi(eventId, payload),

    onSuccess: (event) => {
      // Patch both detail cache variants
      qc.setQueryData(eventKeys.detail(event._id), event);
      qc.setQueryData(eventKeys.detail(event.slug), event);
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      toast.success("Event updated.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error("Event name already in use.");
      } else if (status === 409) {
        toast.error("Ended or archived events cannot be modified.");
      } else if (status === 400) {
        toast.error(err.message ?? "Invalid update data.");
      } else if (status === 404) {
        toast.error("Event not found.");
      } else {
        toast.error(err.message ?? "Failed to update event.");
      }
    },
  });
}
