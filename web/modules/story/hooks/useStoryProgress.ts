import { getSocket } from "@/shared/lib/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { storyKeys } from "../queries/story.queries";
import { getStoryProgressApi } from "../api/story.api";
import { STALE } from "../constants/story.constants";

/**
 * Fetches the progress of a story.
 *
 * When a submission is marked correct, invalidate the progress cache.
 *
 * @param {string} storyId - The ID of the story.
 * @param {boolean} enabled - Whether the query should be enabled or not.
 * @returns {UseQueryResult} - The result of the query.
 *
 * @example
 * const { data, error, isLoading } = useStoryProgress('1234567890abcdef');
 */
export function useStoryProgress(storyId: string, enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !storyId || !enabled) return;

    const handler = () => {
      qc.invalidateQueries({ queryKey: storyKeys.progress(storyId) });
    };

    socket.on("submission:correct", handler);
    return () => {
      socket.off("submission:correct", handler);
    };
  }, [storyId, enabled, qc]);

  return useQuery({
    queryKey: storyKeys.progress(storyId),
    queryFn: () => getStoryProgressApi(storyId),
    enabled: enabled && !!storyId,
    staleTime: STALE.PROGRESS,
    retry: false,
  });
}
