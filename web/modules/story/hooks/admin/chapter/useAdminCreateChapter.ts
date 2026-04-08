import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { storyKeys } from "../../../queries/story.queries";
import { CreateChapterFormData } from "../../../schemas/story.schema";
import { adminCreateChapterApi } from "../../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminCreateChapter(storyId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChapterFormData) =>
      adminCreateChapterApi(storyId, payload),

    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      toast.success("Chapter created.");
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to create chapter.");
    },
  });
}
