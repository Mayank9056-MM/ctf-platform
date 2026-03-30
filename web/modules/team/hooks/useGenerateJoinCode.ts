import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateJoinCodeApi } from "../api/team.api";
import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/queries/dashboard.keys";

export function useGenerateJoinCode(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => generateJoinCodeApi(teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.myTeam });
    },
  });
}