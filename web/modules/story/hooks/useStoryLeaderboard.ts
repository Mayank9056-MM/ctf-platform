import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { storyKeys } from "../queries/story.queries";
import { getStoryLeaderboardApi } from "../api/story.api";
import { STALE } from "../constants/story.constants";

/**
 * Hook to fetch the leaderboard of a story.
 *
 * @param {string} storyId - The ID of the story.
 * @param {number} page - The page number of the leaderboard.
 * @param {boolean} enabled - Whether the query should be enabled or not.
 *
 * @example
 * const { data, error, isLoading } = useStoryLeaderboard('1234567890abcdef');
 */
export function useStoryLeaderboard(storyId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: storyKeys.leaderboard(storyId, page),
    queryFn: () => getStoryLeaderboardApi(storyId, page),
    enabled: enabled && !!storyId,
    staleTime: STALE.LEADERBOARD,
    placeholderData: keepPreviousData,
  });
}
 