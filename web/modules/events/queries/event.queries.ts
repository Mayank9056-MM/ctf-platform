import {
  AdminEventListFilters,
  EventListFilters,
  LeaderboardFilters,
} from "../types/event.type";

// Base key
const baseKey = ["events"] as const;

export const eventKeys = {
  all: baseKey,

  // Player
  lists: () => [...baseKey, "list"] as const,
  list: (filters: EventListFilters) => [...baseKey, "list", filters] as const,

  details: () => [...baseKey, "detail"] as const,
  detail: (idOrSlug: string) => [...baseKey, "detail", idOrSlug] as const,

  leaderboards: () => [...baseKey, "leaderboard"] as const,
  leaderboard: (id: string, filters: LeaderboardFilters) =>
    [...baseKey, "leaderboard", id, filters] as const,

  stats: (id: string) => [...baseKey, "stats", id] as const,

  // Admin
  admin: {
    all: [...baseKey, "admin"] as const,
    lists: () => [...baseKey, "admin", "list"] as const,
    list: (filters: AdminEventListFilters) =>
      [...baseKey, "admin", "list", filters] as const,
  },
} as const;
