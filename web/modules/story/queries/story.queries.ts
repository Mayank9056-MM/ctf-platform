import type { StoryListFilters } from "../types/story.types";

const base = ["stories"] as const;

export const storyKeys = {
  all: base,

  lists: () => [...base, "list"] as const,
  list: (filters: StoryListFilters) => [...base, "list", filters] as const,

  details: () => [...base, "detail"] as const,
  detail: (idOrSlug: string) => [...base, "detail", idOrSlug] as const,

  progress: (id: string) => [...base, "progress", id] as const,

  leaderboard: (id: string, page?: number) =>
    [...base, "leaderboard", id, page ?? 1] as const,

  admin: {
    all: [...base, "admin"] as const,
    lists: () => [...base, "admin", "list"] as const,
    list: (filters: StoryListFilters) =>
      [...base, "admin", "list", filters] as const,
    detail: (id: string) => [...base, "admin", "detail", id] as const,
    validate: (storyId: string, chapterId: string) =>
      [...base, "admin", "validate", storyId, chapterId] as const,
  },
} as const;
