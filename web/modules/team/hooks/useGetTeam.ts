import { useQuery } from "@tanstack/react-query";
import { getTeamApi } from "../api/team.api";

/**
 * Hook to fetch a team by its ID.
 *
 * @param teamId The ID of the team to fetch.
 * @returns A react-query hook containing the team data.
 */
export const useGetTeam = (teamId: string) => {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeamApi(teamId),
    enabled: !!teamId,
  });
};
