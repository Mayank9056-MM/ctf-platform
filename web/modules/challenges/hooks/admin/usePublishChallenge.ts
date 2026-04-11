import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPublishChallengeApi } from "../../api/challenges.api";
import { challengeKeys } from "../../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function usePublishChallenge() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (id: string) => adminPublishChallengeApi(id),
 
    onSuccess: (challenge) => {
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      // Invalidate player list so the newly published challenge appears
      qc.invalidateQueries({ queryKey: challengeKeys.lists() });
      toast.success(`"${challenge.title}" is now live for players.`);
    },
 
    onError: (err: ApiError) => {
      const msg = err.message?.toLowerCase() ?? "";
      if (msg.includes("flag")) {
        toast.error("Cannot publish: challenge has no flag set.");
      } else if (err.statusCode === 404) {
        toast.error("Challenge not found.");
      } else {
        toast.error(err.message ?? "Failed to publish challenge.");
      }
    },
  });
}