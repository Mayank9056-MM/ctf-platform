import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advanceNodeApi } from "../api/story.api";
import { storyKeys } from "../queries/story.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

/**
 * Advance a cutscene or briefing node.
 * On success, updates progress and invalidates the story detail
 * (solveCount on the current challenge node may have changed).
 */
export function useAdvanceNode(
  storyId: string,
  chapterId: string,
  nodeId: string,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (elapsedSeconds = 0) =>
      advanceNodeApi(storyId, chapterId, nodeId, elapsedSeconds),

    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: storyKeys.progress(storyId) });

      if (result.storyCompleted) {
        toast.success("🎉 Story complete!", {
          description: `+${result.completionXpBonus} XP bonus earned.`,
          duration: 6000,
        });
      } else if (result.chapterCompleted) {
        toast.success("Chapter complete! ✅", { duration: 4000 });
      }
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Could not advance node.");
    },
  });
}
