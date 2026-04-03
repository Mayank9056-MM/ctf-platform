import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInviteApi, declineInviteApi } from "../../api/team.api";
import { Team } from "../../types/team.types";
import { teamKeys } from "../../queries/team.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

const USER_CURRENT_KEY = ["user", "current"];
const NOTIFICATION_SUMMARY_KEY = ["notifications", "summary"];


export function useRespondToInvite(teamId: string) {
  const qc = useQueryClient();

  return useMutation<Team | void, ApiError, { accept: boolean }>({
    mutationFn: ({ accept }) =>
      accept ? acceptInviteApi(teamId) : declineInviteApi(teamId),

    onSuccess: (result, { accept }) => {
      if (accept && result) {
        qc.setQueryData(teamKeys.mine(), result);
        qc.invalidateQueries({ queryKey: USER_CURRENT_KEY });
        qc.invalidateQueries({ queryKey: NOTIFICATION_SUMMARY_KEY });
        toast.success("You've joined the team! 🎉");
      } else {
        qc.invalidateQueries({ queryKey: teamKeys.mine() });
        toast.success("Invite declined.");
      }
    },

    onError: (err, { accept }) => {
      const status = err.statusCode;

      if (status === 404) {
        toast.error("Invite not found or already expired.");
        qc.invalidateQueries({ queryKey: teamKeys.mine() });
      } else if (status === 409) {
        toast.error(
          accept
            ? "You are already in a team. Leave first."
            : (err.message ?? "Could not decline invite."),
        );
      } else if (status === 400) {
        toast.error(
          err.message ?? "Team is now full. Invite has been removed.",
        );
        qc.invalidateQueries({ queryKey: teamKeys.mine() });
      } else {
        toast.error(
          err.message ?? `Failed to ${accept ? "accept" : "decline"} invite.`,
        );
      }
    },
  });
}
