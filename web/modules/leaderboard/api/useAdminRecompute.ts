import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLeaderboardStore } from "../store/leaderboard.store";
import { adminRecomputeApi } from "./leaderboard.api";
import { leaderboardKeys } from "../queries/leaderboard.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

/**
 * Hook to trigger an on-demand leaderboard recompute.
 * If all=true, will recompute all stale leaderboards.
 * If scope is provided, will recompute one specific leaderboard.
 * Will invalidate all leaderboard query caches after completion.
 * @return A useMutation hook with the following properties:
 *   mutationFn: Trigger the recompute with the given parameters.
 *   onSuccess: Called when the recompute is successful.
 *   onError: Called when the recompute fails.
 */
export function useAdminRecompute() {
  const qc = useQueryClient();
  const setIsRecomputing = useLeaderboardStore((s) => s.setIsRecomputing);

  return useMutation({
    mutationFn: (params: Parameters<typeof adminRecomputeApi>[0] = {}) => {
      setIsRecomputing(true);
      return adminRecomputeApi(params);
    },

    onSuccess: (result) => {
      setIsRecomputing(false);

      // Invalidate all board caches — every scope/page combination
      qc.invalidateQueries({ queryKey: leaderboardKeys.boards() });
      qc.invalidateQueries({ queryKey: leaderboardKeys.myRank() });

      if (result.recomputed) {
        // all=true response
        const count = result.recomputed.length;
        const totalMs = result.recomputed.reduce(
          (acc, r) => acc + r.durationMs,
          0,
        );

        if (count === 0) {
          toast.info("No stale leaderboards needed recomputing.");
        } else {
          toast.success(
            `Recomputed ${count} leaderboard${count !== 1 ? "s" : ""} in ${totalMs}ms.`,
          );
        }
      } else if (result.scope) {
        toast.success(
          `"${result.scope}" recomputed in ${result.durationMs}ms.`,
        );
      }
    },

    onError: (err: ApiError) => {
      setIsRecomputing(false);

      const status = err.statusCode;
      if (status === 400) {
        toast.error(err.message ?? "Provide scope= or all=true.");
      } else if (status === 403) {
        toast.error("Superadmin privileges required.");
      } else if (status === 404) {
        toast.error("Event not found for this eventId.");
      } else {
        toast.error(err.message ?? "Recompute failed.");
      }
    },
  });
}
