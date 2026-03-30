import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInviteApi } from "../api/team.api";
import { toast } from "sonner";

export const useAcceptInvite = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => acceptInviteApi(teamId),
    onSuccess: (_, teamId) => {
      // User now has a team (refresh)
      qc.invalidateQueries({ queryKey: ["my-team"] });

      // refresh that team details
      qc.invalidateQueries({ queryKey: ["team", teamId] });

      // refresh search/leaderboard
      qc.invalidateQueries({ queryKey: ["teams"] });

      toast.success("Invite accepted");
    },
    onError: (error) => {
      console.log("Accept invite failed: ", error);
      toast.error("Accept invite failed. Please try again");
    },
  });
};
