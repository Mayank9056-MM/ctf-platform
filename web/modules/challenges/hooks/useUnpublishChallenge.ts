import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUnpublishChallengeApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useUnpublishChallenge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUnpublishChallengeApi(id),

    onSuccess: (challenge) => {
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: challengeKeys.lists() });
      toast.success(`"${challenge.title}" hidden from players.`);
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to unpublish challenge.");
    },
  });
}
