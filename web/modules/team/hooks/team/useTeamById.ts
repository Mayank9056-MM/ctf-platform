import { useQuery } from "@tanstack/react-query";
import { teamKeys } from "../../queries/team.queries";
import { getTeamByIdApi } from "../../api/team.api";
import { TEAM_STALE } from "../../constants/team.constants";

/**
 * Public team profile — no auth required.
 * Used on /teams/:id pages. Does not include invites or join code.
 */
export function useTeamById(id: string, enabled = true) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => getTeamByIdApi(id),
    enabled: enabled && !!id,
    staleTime: TEAM_STALE.TEAM_DETAIL,
  });
}
