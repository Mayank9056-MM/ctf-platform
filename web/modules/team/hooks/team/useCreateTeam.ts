import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { createTeamApi } from "../../api/team.api";
import { CreateTeamPayload } from "../../types/team.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTeamStore } from "../../store/team.store";

const USER_CURRENT_KEY = ["user", "current"];

/**
 * Create a new team. Invalidates my-team so the new team appears immediately.
 * Also invalidates user current to sync user.teamId.
 */
export function useCreateTeam() {
  const qc = useQueryClient();
  const resetInputs = useTeamStore((s) => s.resetInputs);

  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeamApi(payload),

    onSuccess: (team) => {
      qc.setQueryData(teamKeys.mine(), team);
      qc.invalidateQueries({ queryKey: USER_CURRENT_KEY });
      resetInputs();
      toast.success(`Team "${team.name}" created! 🎉`, {
        description: "Share your join code to invite members.",
      });
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("already in a team")) {
          toast.error(
            "You are already in a team. Leave your current team first.",
          );
        } else if (msg.includes("name")) {
          toast.error("Team name already exists. Try a different name.");
        } else {
          toast.error(err.message ?? "Invalid team data.");
        }
      } else if (status === 409) {
        toast.error("Team name already taken. Choose a different name.");
      } else {
        toast.error(err.message ?? "Failed to create team.");
      }
    },
  });
}
