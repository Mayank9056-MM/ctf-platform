import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCreateChallengeApi } from "../../api/challenges.api";
import { CreateChallengeInput } from "../../types/challenge.types";
import { challengeKeys } from "../../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

 
export function useCreateChallenge() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (data: CreateChallengeInput) => adminCreateChallengeApi(data),
 
    onSuccess: (challenge) => {
      // Invalidate the admin list so the new challenge appears immediately
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: challengeKeys.admin.stats() });
 
      toast.success(`Challenge "${challenge.title}" created.`, {
        description: "It's saved as a draft. Publish when ready.",
      });
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 409) {
        toast.error("A challenge with this title already exists.");
      } else if (err.statusCode === 400) {
        toast.error(err.message ?? "Invalid challenge data.");
      } else {
        toast.error(err.message ?? "Failed to create challenge.");
      }
    },
  });
}
 