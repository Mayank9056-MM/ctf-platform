import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { adminDeleteEventApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hard-delete an event. Blocked on active events.
 * Superadmin only.
 */
export function useAdminDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeleteEventApi(id),

    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: eventKeys.detail(id) });
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success("Event deleted.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error(
          "Cannot delete an active event. End it first, then delete.",
        );
      } else if (status === 404) {
        toast.error("Event not found.");
      } else if (status === 403) {
        toast.error("Superadmin privileges required to delete events.");
      } else {
        toast.error(err.message ?? "Failed to delete event.");
      }
    },
  });
}
