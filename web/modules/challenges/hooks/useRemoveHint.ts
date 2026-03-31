import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRemoveHintApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useRemoveHint(challengeId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (hintIndex: number) =>
      adminRemoveHintApi(challengeId, hintIndex),

    onSuccess: (challenge) => {
      qc.setQueryData(challengeKeys.detail(challenge.slug), challenge);
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      toast.success("Hint removed.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        toast.error("Hint not found at this index.");
      } else {
        toast.error(err.message ?? "Failed to remove hint.");
      }
    },
  });
}
