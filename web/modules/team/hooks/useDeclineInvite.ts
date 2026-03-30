import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declineInviteApi } from "../api/team.api";
import { toast } from "sonner";

export const useDeclineInvite = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => declineInviteApi(teamId),
    onSuccess: (_, teamId) => {
      // Update team data
      qc.invalidateQueries({ queryKey: ["team", teamId] });

      // refresh my team
      qc.invalidateQueries({ queryKey: ["my-team"] });

      toast.success("Invite declined");
    },
    onError: (error) => {
      console.log("Decline invite failed: ", error);
      toast.error("Decline invite failed. Please try again");
    },
  });
};
