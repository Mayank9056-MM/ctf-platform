import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { adminDisbandTeamApi } from "../../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const USER_CURRENT_KEY = ["user", "current"];

/**
 * Disband a team entirely. Admin/superadmin only.
 * Removes all members, deactivates team, clears team caches.
 */
export function useAdminDisbandTeam() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => adminDisbandTeamApi(teamId),

    onSuccess: (_, teamId) => {
      qc.removeQueries({ queryKey: teamKeys.detail(teamId) });
      qc.setQueryData(teamKeys.mine(), null);
      qc.invalidateQueries({ queryKey: USER_CURRENT_KEY });
      toast.success("Team disbanded. All members have been unlinked.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 404) {
        toast.error("Team not found.");
      } else if (status === 403) {
        toast.error("Admin privileges required to disband a team.");
      } else {
        toast.error(err.message ?? "Failed to disband team.");
      }
    },
  });
}
