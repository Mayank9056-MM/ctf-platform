import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { UpdateTeamPayload } from "../../types/team.types";
import { updateTeamApi } from "../../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTeamStore } from "../../store/team.store";

/**
 * Update team settings. Updates the my-team cache directly for instant UI response.
 */
export function useUpdateTeam(teamId: string) {
  const qc = useQueryClient();
  const setIsEditing = useTeamStore((s) => s.setIsEditingTeam);

  return useMutation({
    mutationFn: (payload: UpdateTeamPayload) => updateTeamApi(teamId, payload),

    onSuccess: (team) => {
      // Update both caches — my team and public profile (if cached)
      qc.setQueryData(teamKeys.mine(), team);
      qc.setQueryData(teamKeys.detail(teamId), team);
      setIsEditing(false);
      toast.success("Team settings updated.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 409) {
        toast.error("Team name already taken.");
      } else if (status === 403) {
        toast.error("Only the team owner can update team settings.");
      } else if (status === 400) {
        toast.error(err.message ?? "Invalid update data.");
      } else {
        toast.error(err.message ?? "Failed to update team.");
      }
    },
  });
}
