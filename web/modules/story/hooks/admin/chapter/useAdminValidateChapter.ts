import { useMutation } from "@tanstack/react-query";
import { adminValidateChapterApi } from "../../../api/story.api";

export function useAdminValidateChapter(storyId: string, chapterId: string) {
  return useMutation({
    mutationFn: () => adminValidateChapterApi(storyId, chapterId),
  });
}
