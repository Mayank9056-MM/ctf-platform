import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { storyKeys } from "../../../queries/story.queries";
import { adminPublishChapterApi } from "../../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminPublishChapter(storyId: string, chapterId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: () => adminPublishChapterApi(storyId, chapterId),
 
    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      // Invalidate validation cache — chapter is now published
      qc.removeQueries({ queryKey: storyKeys.admin.validate(storyId, chapterId) });
      toast.success("Chapter published! Players can now access it.");
    },
 
    onError: (err: ApiError) => {
      const msg = err.message?.toLowerCase() ?? "";
      if (msg.includes("graph") || msg.includes("valid")) {
        toast.error("Graph validation failed. Fix errors before publishing.", {
          description: err.message,
        });
      } else {
        toast.error(err.message ?? "Failed to publish chapter.");
      }
    },
  });
}