import { toast } from "sonner";
import { storyKeys } from "../../../queries/story.queries";
import { ApiError } from "next/dist/server/api-utils";
import { adminDeleteChapterApi } from "../../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminDeleteChapter(storyId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (chapterId: string) =>
      adminDeleteChapterApi(storyId, chapterId),
 
    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      toast.success("Chapter deleted.");
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to delete chapter.");
    },
  });
}
 