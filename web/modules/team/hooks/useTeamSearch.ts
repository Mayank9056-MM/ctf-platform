import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchTeamsApi } from "../api/team.api";
import { TEAM_STALE } from "../constants/team.constants";
import { teamKeys } from "../queries/team.queries";
import { SearchTeamParams } from "../types/team.types";
import { useTeamSearchState } from "../store/team.store";

/**
 * Search public teams. Reads params from Zustand store.
 * Only fires when query is >= 2 characters OR country/sort filters are set.
 * keepPreviousData prevents layout shift when changing page.
 */
export function useTeamSearch(override?: SearchTeamParams) {
  const { query, page, country, sortBy, sortOrder } = useTeamSearchState();

  const params: SearchTeamParams = override ?? {
    q: query.trim().length >= 2 ? query.trim() : undefined,
    page,
    limit: 12,
    ...(country && { country }),
    sortBy,
    sortOrder,
  };

  const isEnabled =
    (params.q !== undefined && params.q.length >= 2) ||
    !!params.country ||
    override !== undefined;

  return useQuery({
    queryKey: teamKeys.search(params),
    queryFn: () => searchTeamsApi(params),
    enabled: isEnabled,
    staleTime: TEAM_STALE.SEARCH,
    placeholderData: keepPreviousData,
  });
}
