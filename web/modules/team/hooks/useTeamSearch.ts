import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchTeamsApi } from "../api/team.api";
import { TEAM_STALE } from "../constants/team.constants";
import { teamKeys } from "../queries/team.queries";
import { SearchTeamParams } from "../types/team.types";
import { useTeamStore } from "../store/team.store";
import { useMemo } from "react";

/**
 * Search public teams. Reads params from Zustand store.
 * Only fires when query is >= 2 characters OR country/sort filters are set.
 * keepPreviousData prevents layout shift when changing page.
 */
export function useTeamSearch(override?: SearchTeamParams) {
  const query = useTeamStore((s) => s.searchQuery);
  const page = useTeamStore((s) => s.searchPage);
  const country = useTeamStore((s) => s.searchCountry);
  const sortBy = useTeamStore((s) => s.searchSortBy);
  const sortOrder = useTeamStore((s) => s.searchSortOrder);

  const params = useMemo(() => {
    if (override) return override;

    return {
      q: query.trim().length >= 2 ? query.trim() : undefined,
      page,
      limit: 12,
      ...(country && { country }),
      sortBy,
      sortOrder,
    };
  }, [override, query, page, country, sortBy, sortOrder]);

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
