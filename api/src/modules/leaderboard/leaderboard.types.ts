import {
  ILeaderboardEntry,
  LeaderboardScope,
} from "../../models/leaderboard.model";

export type LeaderboardEntityType = "user" | "team";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type LeaderboardResponse = {
  scope: LeaderboardScope;
  eventId?: string;
  isFrozen: boolean;
  frozenAt?: string;
  isStale: boolean;
  computedAt: string;
  ageSeconds: number;
  entries: ILeaderboardEntry[];
  meta: PaginationMeta;
  /** The requesting user's own entry, even if outside top-N */
  myEntry?: ILeaderboardEntry & { rank: number };
};

// Payload the service builds before calling upsertBoard
export type ComputedBoardData = {
  entries: ILeaderboardEntry[];
  totalCount: number;
  isFrozen?: boolean;
  frozenAt?: Date | null;
};

// Filter for the GET /leaderboard endpoint
export type LeaderboardFilters = {
  page: number;
  limit: number;
  scope: LeaderboardScope;
  eventId?: string;
};
