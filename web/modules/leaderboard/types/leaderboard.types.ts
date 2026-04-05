// Scope (mirrors backend LeaderboardScope)

export const LEADERBOARD_SCOPES = [
  "global_user",
  "global_team",
  "event_user",
  "event_team",
] as const;

export type LeaderboardScope = (typeof LEADERBOARD_SCOPES)[number];
export type LeaderboardEntityType = "user" | "team";

// Entry

export type LeaderboardEntry = {
  rank: number;
  entityId: string;
  entityType: LeaderboardEntityType;
  /** username for users, team name for teams */
  username: string;
  avatar?: { url: string };
  country?: string;
  teamId?: string;
  teamName?: string;
  score: number;
  solveCount: number;
  firstBloods: number;
  lastSolveAt?: string;
};

// Pagination

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// API Response

export type LeaderboardResponse = {
  scope: LeaderboardScope;
  eventId?: string;
  isFrozen: boolean;
  frozenAt?: string;
  isStale: boolean;
  computedAt: string;
  /** Seconds since the snapshot was computed */
  ageSeconds: number;
  entries: LeaderboardEntry[];
  meta: PaginationMeta;
  /** Requesting user's own entry — present even if outside top-N */
  myEntry?: LeaderboardEntry & { rank: number };
};

export type MyRankResponse = LeaderboardEntry & { rank: number };

export type AdminRecomputeResponse = {
  scope?: LeaderboardScope;
  durationMs?: number;
  recomputed?: { scope: string; durationMs: number }[];
};

// Filter types

export type LeaderboardQueryFilters = {
  scope: LeaderboardScope;
  eventId?: string;
  page?: number;
  limit?: number;
};

// Zustand UI state

export type LeaderboardUIState = {
  // Filter controls
  scope: LeaderboardScope;
  eventId: string | null;
  page: number;
  limit: number;

  // Admin recompute
  isRecomputing: boolean;

  // Actions
  setScope: (scope: LeaderboardScope) => void;
  setEventId: (id: string | null) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
  setIsRecomputing: (v: boolean) => void;
};