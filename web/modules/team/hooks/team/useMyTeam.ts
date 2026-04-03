import { useQuery } from "@tanstack/react-query";
import { teamKeys } from "../../queries/team.queries";
import { getMyTeamApi } from "../../api/team.api";
import { TEAM_STALE } from "../../constants/team.constants";

/**
 * Fetch the authenticated user's team, including invites.
 * Returns null if the user is not in a team.
 * Used everywhere in the dashboard — single source of truth for team state.
 */
export function useMyTeam() {
  return useQuery({
    queryKey: teamKeys.mine(),
    queryFn: getMyTeamApi,
    staleTime: TEAM_STALE.MY_TEAM,
  });
}
