import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { ApiError } from "next/dist/server/api-utils";
import { kickMemberApi } from "../../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Remove a member from the team. Owner only.
 * Updates the my-team cache by filtering out the kicked member.
 */
export function useKickMember(teamId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => kickMemberApi(teamId, userId),

    onSuccess: (_, userId) => {
      // Optimistic: remove member from cache immediately
      qc.setQueryData(teamKeys.mine(), (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m: any) => m._id !== userId),
        };
      });
      toast.success("Member removed from team.");
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      // Re-sync after error so UI is consistent
      qc.invalidateQueries({ queryKey: teamKeys.mine() });
      if (status === 400) {
        toast.error(
          err.message ?? "Cannot kick yourself. Use leave team instead.",
        );
      } else if (status === 403) {
        toast.error("Only the team owner can kick members.");
      } else if (status === 404) {
        toast.error("Team not found.");
      } else {
        toast.error(err.message ?? "Failed to remove member.");
      }
    },
  });
}
