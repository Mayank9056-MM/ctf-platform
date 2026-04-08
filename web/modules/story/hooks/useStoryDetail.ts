import { useQuery } from "@tanstack/react-query";
import { storyKeys } from "../queries/story.queries";
import { getStoryDetailApi } from "../api/story.api";
import { STALE } from "../constants/story.constants";

/**
 * Hook to fetch the detail of a story.
 *
 * @param {string} idOrSlug - The ID or slug of the story.
 * @param {boolean} enabled - Whether the query should be enabled or not.
 * @returns {UseQueryResult} - The result of the query.
 *
 * @example
 * const { data, error, isLoading } = useStoryDetail('1234567890abcdef');
 */
export function useStoryDetail(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: storyKeys.detail(idOrSlug),
    queryFn: () => getStoryDetailApi(idOrSlug),
    enabled: enabled && !!idOrSlug,
    staleTime: STALE.DETAIL,
  });
}