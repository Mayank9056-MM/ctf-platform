import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { inviteUserApi } from "../../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTeamStore } from "../../store/team.store";

/**
 * Invite a user by username. Owner only.
 * Invalidates my-team so the invites list refreshes.
 */
export function useInviteUser(teamId: string) {
  const qc = useQueryClient();
  const setInviteInput = useTeamStore((s) => s.setInviteUsernameInput);
 
  return useMutation({
    mutationFn: (username: string) => inviteUserApi(teamId, username),
 
    onSuccess: (_, username) => {
      qc.invalidateQueries({ queryKey: teamKeys.mine() });
      setInviteInput("");
      toast.success(`Invite sent to ${username}.`);
    },
 
    onError: (err: ApiError, username) => {
      const status = err.statusCode;
      if (status === 404) {
        toast.error(`User "${username}" not found.`);
      } else if (status === 400) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("full")) {
          toast.error("Team is full. Remove a member before inviting.");
        } else {
          toast.error(err.message ?? "Cannot invite this user.");
        }
      } else if (status === 409) {
        toast.error(err.message ?? `${username} is already invited or in a team.`);
      } else if (status === 403) {
        toast.error("Only the team owner can send invites.");
      } else {
        toast.error(err.message ?? "Failed to send invite.");
      }
    },
  });
}