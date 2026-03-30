import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDisbandTeamApi } from "../api/team.api";
import { toast } from "sonner";

export const useAdminDisbandTeam = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => adminDisbandTeamApi(teamId),
    onSuccess: (_, teamId) => {
      // remove team from cache
      qc.removeQueries({ queryKey: ["team", teamId] });

      // refresh team list/leaderboard
      qc.invalidateQueries({ queryKey: ["teams"] });

      // refresh current user's team
      qc.invalidateQueries({ queryKey: ["my-team"] });

      toast.success("Team disband successfully");
    },
    onError: (error) => {
      console.log("Disband team failed: ", error);
      toast.error("Disband team failed. Please try again");
    },
  });
};
