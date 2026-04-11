import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUpdateChallengeApi } from "../../api/challenges.api";
import { UpdateChallengeInput } from "../../types/challenge.types";
import { challengeKeys } from "../../queries/challenge.keys";

export function useUpdateChallenge(challengeId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (data: UpdateChallengeInput) =>
      adminUpdateChallengeApi(challengeId, data),
 
    onSuccess: (challenge) => {
      // Update the detail cache directly to avoid a round-trip
      qc.setQueryData(
        challengeKeys.detail(challenge.slug),
        challenge
      );
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
 
      toast.success("Challenge updated.");
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 409) {
        toast.error("Challenge title already taken.");
      } else if (err.statusCode === 404) {
        toast.error("Challenge not found.");
      } else {
        toast.error(err.message ?? "Failed to update challenge.");
      }
    },
  });
}
 