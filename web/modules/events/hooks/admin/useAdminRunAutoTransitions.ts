import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { adminRunAutoTransitionsApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Manually trigger the auto-transition cron. Superadmin only.
 * Recovery when a cron tick is missed.
 */
export function useAdminRunAutoTransitions() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: adminRunAutoTransitionsApi,

    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: eventKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: eventKeys.lists() });

      const { activated, ended } = result;
      const parts: string[] = [];
      if (activated.length) parts.push(`${activated.length} activated`);
      if (ended.length) parts.push(`${ended.length} ended`);

      if (parts.length === 0) {
        toast.info("Auto-transition: no events needed transitioning.");
      } else {
        toast.success(`Auto-transition complete: ${parts.join(", ")}.`);
      }
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Auto-transition failed.");
    },
  });
}
