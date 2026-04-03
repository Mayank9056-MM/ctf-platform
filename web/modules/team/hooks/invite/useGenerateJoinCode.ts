import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { ApiError } from "next/dist/server/api-utils";
import { generateJoinCodeApi } from "../../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Generate or regenerate the team's join code. Owner only.
 * Updates the my-team cache with the new join code.
 */
export function useGenerateJoinCode(teamId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: () => generateJoinCodeApi(teamId),
 
    onSuccess: (newCode) => {
      // Patch the join code in the cached team object without a refetch
      qc.setQueryData(teamKeys.mine(), (prev) => {
        if (!prev) return prev;
        return { ...prev, joinCode: newCode };
      });
      toast.success("New join code generated.", {
        description: "Share it with the players you want to invite.",
      });
    },
 
    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 403) {
        toast.error("Only the team owner can generate join codes.");
      } else {
        toast.error(err.message ?? "Failed to generate join code.");
      }
    },
  });
}