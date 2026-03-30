import { useQuery } from "@tanstack/react-query";
import { searchTeamsApi } from "../api/team.api";

/**
 * Hook to search for teams by a given query string.
 *
 * @param query The string to search for in team names.
 * @returns A react-query hook containing the search results.
 */
export const useSearchTeams = (query: string) => {
  return useQuery({
    queryKey: ["teams", "search", query],
    queryFn: () => searchTeamsApi(query),
    enabled: !!query,
  });
};
