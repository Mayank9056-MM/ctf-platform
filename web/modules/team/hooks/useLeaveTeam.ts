import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/queries/dashboard.keys";
import { leaveTeamApi } from "../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useLeaveTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveTeamApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.myTeam });
    },
  });
}
 