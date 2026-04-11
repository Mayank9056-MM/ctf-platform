import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { adminDeleteChallengeApi } from "../../api/challenges.api";
import { challengeKeys } from "../../queries/challenge.keys";

export function useDeleteChallenge() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (id: string) => adminDeleteChallengeApi(id),
 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: challengeKeys.admin.stats() });
      toast.success("Challenge deleted.");
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        toast.error("Challenge not found.");
      } else if (err.statusCode === 409) {
        toast.error(
          "Cannot delete a challenge with existing correct submissions. Unpublish it instead."
        );
      } else {
        toast.error(err.message ?? "Failed to delete challenge.");
      }
    },
  });
}
 