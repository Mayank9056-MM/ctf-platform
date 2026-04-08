import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { STALE } from "../../constants/story.constants";
import { getStoriesApi } from "../../api/story.api";
import { storyKeys } from "../../queries/story.queries";
import { StoryListFilters } from "../../types/story.types";
import { useStoryStore } from "../../store/story.store";

export function useAdminStories(override?: StoryListFilters) {
  const { adminPage, adminStatusFilter, adminSearch } = useStoryStore();

  const filters: StoryListFilters = override ?? {
    page: adminPage,
    limit: 20,
    ...(adminStatusFilter !== "all" && { status: adminStatusFilter }),
    ...(adminSearch.trim() && { search: adminSearch.trim() }),
  };

  return useQuery({
    queryKey: storyKeys.admin.list(filters),
    queryFn: () => getStoriesApi(filters),
    staleTime: STALE.LIST,
    placeholderData: keepPreviousData,
  });
}
