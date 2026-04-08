import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MakeChoiceFormData } from "../schemas/story.schema";
import { makeChoiceApi } from "../api/story.api";
import { storyKeys } from "../queries/story.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export function useMakeChoice(
  storyId: string,
  chapterId: string,
  nodeId: string,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: MakeChoiceFormData) =>
      makeChoiceApi(storyId, chapterId, nodeId, payload),

    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: storyKeys.progress(storyId) });

      if (result.storyCompleted) {
        toast.success("🎉 Story complete!", {
          description: `+${result.completionXpBonus} XP`,
          duration: 6000,
        });
      }
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 400) {
        toast.error(err.message ?? "Invalid choice.");
      } else {
        toast.error(err.message ?? "Could not process choice.");
      }
    },
  });
}
