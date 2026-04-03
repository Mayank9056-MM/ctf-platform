import { SearchTeamParams } from "../types/team.types";

export const teamKeys = {
  all: ["teams"] as const,

  // Player

  /** My team (includes invites) — authenticated */
  mine: () => [...teamKeys.all, "mine"] as const,

  /** Public team profile — unauthenticated */
  detail: (id: string) => [...teamKeys.all, "detail", id] as const,

  /** Team search results */
  searches: () => [...teamKeys.all, "search"] as const,
  search: (params: SearchTeamParams) =>
    [...teamKeys.searches(), params] as const,
} as const;
