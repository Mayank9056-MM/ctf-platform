import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminManualScoreAdjustApi } from "../../api/admin.api";
import { ManualScoreAdjustFormData } from "../../schema/admin.schema";
import { adminKeys } from "../../queries/admin.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export function useAdminScoreAdjust(userId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualScoreAdjustFormData) =>
      adminManualScoreAdjustApi(userId, payload),

    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      qc.invalidateQueries({ queryKey: ["leaderboard"] }); // invalidate leaderboard snapshots

      const sign = result.delta > 0 ? "+" : "";
      toast.success(
        `Score adjusted by ${sign}${result.delta}. New score: ${result.newScore}.`,
      );
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to adjust score.");
    },
  });
}
