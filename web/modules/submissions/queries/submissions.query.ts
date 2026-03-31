import type {
  AdminStatsFilters,
  AdminSubmissionsFilters,
  MySubmissionsFilters,
} from "../types/submission.types";

const base = ["submissions"] as const;

export const submissionKeys = {
  all: base,

  // ── Player

  /** Own submission history list */
  myLists: () => [...base, "my", "list"] as const,
  myList: (filters: MySubmissionsFilters) =>
    [...base, "my", "list", filters] as const,

  /** Own submission stats */
  myStats: () => [...base, "my", "stats"] as const,

  /** Own attempt history for a specific challenge */
  history: (challengeId: string, page?: number) =>
    [...base, "history", challengeId, page ?? 1] as const,

  /** Public solve leaderboard */
  solves: (challengeId: string, page?: number) =>
    [...base, "solves", challengeId, page ?? 1] as const,

  // Admin

  admin: {
    all: [...base, "admin"] as const,

    lists: () => [...base, "admin", "list"] as const,
    list: (filters: AdminSubmissionsFilters) =>
      [...base, "admin", "list", filters] as const,

    stats: (filters: AdminStatsFilters) =>
      [...base, "admin", "stats", filters] as const,

    detail: (id: string) => [...base, "admin", "detail", id] as const,

    userList: (userId: string, page?: number) =>
      [...base, "admin", "user", userId, page ?? 1] as const,
  },
} as const;
