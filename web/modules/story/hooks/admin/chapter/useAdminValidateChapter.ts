import { useQuery } from "@tanstack/react-query";
import { storyKeys } from "../../../queries/story.queries";
import { adminValidateChapterApi } from "../../../api/story.api";

export function useAdminValidateChapter(
  storyId: string,
  chapterId: string,
  enabled = false,
) {
  return useQuery({
    queryKey: storyKeys.admin.validate(storyId, chapterId),
    queryFn: () => adminValidateChapterApi(storyId, chapterId),
    enabled: enabled && !!storyId && !!chapterId,
    staleTime: 0,
  });
}
