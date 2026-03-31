import { toast } from "sonner";
import { challengeKeys } from "../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { purchaseHintApi } from "../api/challenges.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePurchaseHint(challengeId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (hintIndex: number) => purchaseHintApi(challengeId, hintIndex),

    onSuccess: (data) => {
      // Invalidate the challenge detail so the purchased hint text becomes visible
      qc.invalidateQueries({
        queryKey: challengeKeys.detail(challengeId),
      });
      toast.success(
        `Hint unlocked! ${data.pointsDeducted > 0 ? `-${data.pointsDeducted} pts` : "Free hint"}`,
        { duration: 4000 },
      );
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        toast.error(err.message ?? "Cannot purchase this hint.");
      } else if (status === 402) {
        toast.error("Not enough points to purchase this hint.");
      } else if (status === 409) {
        toast.info("You have already purchased this hint.");
        // Still invalidate — ensure the cached hint text is shown
        qc.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      } else {
        toast.error(err.message ?? "Failed to purchase hint.");
      }
    },
  });
}
