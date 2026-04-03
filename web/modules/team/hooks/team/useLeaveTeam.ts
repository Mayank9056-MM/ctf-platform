import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveTeamApi } from "../../api/team.api";
import { teamKeys } from "../../queries/team.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

const USER_CURRENT_KEY = ["user", "current"];

/**
 * Leave the current team.
 * Clears the my-team cache and syncs the user's teamId field.
 */
export function useLeaveTeam() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: leaveTeamApi,

    onSuccess: () => {
      // Team is gone — set mine to null so components render "no team" state
      qc.setQueryData(teamKeys.mine(), null);
      qc.invalidateQueries({ queryKey: USER_CURRENT_KEY });
      toast.success("You have left the team.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        toast.error(err.message ?? "You are not currently in a team.");
      } else {
        toast.error(err.message ?? "Failed to leave team.");
      }
    },
  });
}
