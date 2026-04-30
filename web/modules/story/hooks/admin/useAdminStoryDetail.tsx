import { useQuery } from "@tanstack/react-query";
import { storyKeys } from "../../queries/story.queries";
import { adminGetStoryApi } from "../../api/story.api";
import { STALE } from "../../constants/story.constants";

export function useAdminStoryDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: storyKeys.adminDetail(id),
    queryFn: () => adminGetStoryApi(id),
    enabled: enabled && !!id,
    staleTime: STALE.DETAIL,
  });
}
