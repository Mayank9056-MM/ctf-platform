import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTeamPayload } from "../types/team.types";
import { updateTeamApi } from "../api/team.api";


export const useUpdateTeam = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: Partial<CreateTeamPayload>;
    }) => updateTeamApi(teamId, data),
    onSuccess: (updatedTeam) => {
      // Update specific team cache
      qc.setQueryData(["team", updatedTeam._id], updatedTeam);

      // refresh my team
      qc.invalidateQueries({ queryKey: ["my-team"] });

      // refresh search/leaderboard
      qc.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => {
      console.error("Error updating team:", error);
    },
  });
};
