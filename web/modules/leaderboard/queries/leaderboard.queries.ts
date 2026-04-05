
// Key hierarchy:
//   ["leaderboard"]                       → root — invalidates everything
//   ["leaderboard", "board"]              → all board variations
//   ["leaderboard", "board", filters]     → one specific scope/page/limit combo
//   ["leaderboard", "me"]                 → authenticated user's own rank

import { LeaderboardQueryFilters } from "../types/leaderboard.types";


export const leaderboardKeys = {
  all: ["leaderboard"] as const,

  /**
   * All paginated board queries (every scope, every page).
   * Use to invalidate all boards at once after a recompute.
   * GET /leaderboard?scope=…&page=…&limit=…
   */
  boards: () => [...leaderboardKeys.all, "board"] as const,

  /**
   * A single board identified by scope + eventId + page + limit.
   * TanStack Query creates a separate cache entry per unique filter object.
   */
  board: (filters: LeaderboardQueryFilters) =>
    [...leaderboardKeys.boards(), filters] as const,

  /**
   * The authenticated user's own rank entry.
   * Returned even when the user is outside the top-N snapshot.
   * GET /leaderboard/me
   */
  myRank: () => [...leaderboardKeys.all, "me"] as const,
} as const;