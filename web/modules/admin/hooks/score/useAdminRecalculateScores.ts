import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { adminKeys } from "../../queries/admin.queries";
import { adminRecalculateScoresApi } from "../../api/admin.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminRecalculateScores() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: adminRecalculateScoresApi,
 
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(
        `Recalculation complete — ${result.usersUpdated} users, ${result.teamsUpdated} teams updated in ${result.durationMs}ms.`
      );
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Recalculation failed.");
    },
  });
}