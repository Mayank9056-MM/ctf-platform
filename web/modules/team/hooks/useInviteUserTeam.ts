import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteUserApi } from "../api/team.api";
import { toast } from "sonner";

export const useInviteUserTeam = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, username }: { teamId: string; username: string }) =>
      inviteUserApi(teamId, username),
    onSuccess: (_, variables) => {
      // refresh team data
      qc.invalidateQueries({ queryKey: ["team", variables.teamId] });

      // refresh my team
      qc.invalidateQueries({ queryKey: ["my-team"] });

      toast.success(`Invite sent to ${variables.username}`);
    },
    onError: (error) => {
      console.log("Invite failed", error);
      toast.error("Invite failed. Please try again");
    },
  });
};
