import { ChallengeFilters } from "../types/challenge.types";

const base = ["challenges"] as const;

export const challengeKeys = {
  all: base,

  // Player
  lists: () => [...base, "list"] as const,
  list: (filters: ChallengeFilters) =>
    [...challengeKeys.lists(), filters] as const,

  details: () => [...base, "detail"] as const,
  detail: (idOrSlug: string) => [...challengeKeys.details(), idOrSlug] as const,

  solves: (id: string, page?: number) =>
    [...base, "solves", id, page ?? 1] as const,

  // Admin
  admin: {
    all: [...base, "admin"] as const,
    lists: () => [...base, "admin", "list"] as const,
    list: (filters: ChallengeFilters) =>
      [...challengeKeys.admin.lists(), filters] as const,
    stats: () => [...base, "admin", "stats"] as const,
    submissions: (id: string, page?: number) =>
      [...base, "admin", "submissions", id, page ?? 1] as const,
  },
} as const;
