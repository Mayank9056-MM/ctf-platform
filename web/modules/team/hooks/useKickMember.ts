import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kickMemberApi } from "../api/team.api";
import { toast } from "sonner";

export const useKickMember = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      kickMemberApi(teamId, userId),
    onSuccess: (_, variables) => {
      const { teamId } = variables;

      // refresh team
      qc.invalidateQueries({ queryKey: ["team", teamId] });

      // refresh my team
      qc.invalidateQueries({ queryKey: ["my-team"] });

      // refresh search/leaderboard
      qc.invalidateQueries({ queryKey: ["teams"] });

      toast.success("Member kicked");
    },
    onError: (error) => {
      console.log("Kick member failed", error);
      toast.error("Member kicked failed. Try again");
    },
  });
};
