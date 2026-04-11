import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAddHintApi } from "../../api/challenges.api";
import { AddHintInput } from "../../types/challenge.types";
import { challengeKeys } from "../../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useAddHint(challengeId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (hint: AddHintInput) => adminAddHintApi(challengeId, hint),

    onSuccess: (challenge) => {
      // Update the admin detail directly
      qc.setQueryData(challengeKeys.detail(challenge.slug), challenge);
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      toast.success("Hint added.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 400) {
        toast.error(err.message ?? "Invalid hint data.");
      } else {
        toast.error(err.message ?? "Failed to add hint.");
      }
    },
  });
}
