import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { StoryListFilters } from "../types/story.types";
import { storyKeys } from "../queries/story.queries";
import { getStoriesApi } from "../api/story.api";
import { STALE } from "../constants/story.constants";

/**
 * Hook to fetch the list of stories with pagination.
 *
 * @param {StoryListFilters} override - Optional filters to override the default values.
 * @returns {UseQueryResult} - The result of the query.
 *
 * @example
 * const { data, error, isLoading } = useStories();
 * 
 * const {
 *   data,
 *   error,
 *   isLoading,
 *   refetch,
 *   isFetching,
 * } = useStories({ page: 2, limit: 10 });
 */
export function useStories(override?: StoryListFilters) {
  const filters: StoryListFilters = override ?? { page: 1, limit: 20 };

  return useQuery({
    queryKey: storyKeys.list(filters),
    queryFn: () => getStoriesApi(filters),
    staleTime: STALE.LIST,
    placeholderData: keepPreviousData,
  });
}
