import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUpdateChapterApi } from "../../../api/story.api";
import { UpdateChapterFormData } from "../../../schemas/story.schema";
import { storyKeys } from "../../../queries/story.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export function useAdminUpdateChapter(storyId: string, chapterId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: UpdateChapterFormData) =>
      adminUpdateChapterApi(storyId, chapterId, payload),
 
    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      toast.success("Chapter updated.");
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to update chapter.");
    },
  });
}