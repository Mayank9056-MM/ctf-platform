import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startStoryApi } from "../api/story.api";
import { storyKeys } from "../queries/story.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

/**
 * Hook to start a story.
 *
 * Starts a story and tracks the user's progress. If the user has already started the story, it will continue where they left off.
 *
 * @param {string} storyId - The ID of the story.
 *
 * @returns {UseMutationResult} - The result of the mutation.
 *
 * @example
 * const { mutate, isLoading, error } = useStartStory('1234567890abcdef');
 */
export function useStartStory(storyId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => startStoryApi(storyId),

    onSuccess: (progress) => {
      qc.setQueryData(storyKeys.progress(storyId), progress);
      toast.success("Story started! 📖", {
        description: "Your progress is being tracked.",
      });
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 409) {
        toast.info(
          "You've already started this story. Continuing where you left off.",
        );
        qc.invalidateQueries({ queryKey: storyKeys.progress(storyId) });
      } else {
        toast.error(err.message ?? "Could not start story.");
      }
    },
  });
}
