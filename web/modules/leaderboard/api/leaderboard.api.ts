import { ApiResponse } from "@/shared/types/api.types";
import {
  AdminRecomputeResponse,
  LeaderboardQueryFilters,
  LeaderboardResponse,
  LeaderboardScope,
  MyRankResponse,
} from "../types/leaderboard.types";
import { api } from "@/shared/lib/api";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// GET /leaderboard
/**
 * Read from the pre-computed snapshot — O(1), no heavy aggregation.
 * Optional auth: annotates myEntry when the user is authenticated.
 */
export async function getLeaderboardApi(
  filters: LeaderboardQueryFilters,
): Promise<LeaderboardResponse> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<LeaderboardResponse>>(
    `/api/v1/leaderboard/leaderboard?${params}`,
  );
  return res.data.data;
}

// GET /leaderboard/me
/**
 * Get the authenticated user's own rank in the global leaderboard.
 * Returned even if the user is outside the top-N snapshot.
 */
export async function getMyRankApi(): Promise<MyRankResponse | null> {
  const res =
    await api.get<ApiResponse<MyRankResponse | { rank: null }>>(
      "/api/v1/leaderboard/leaderboard/me",
    );
  const data = res.data.data;
  return "rank" in data && data.rank === null ? null : (data as MyRankResponse);
}

// POST /admin/leaderboard/recompute
/**
 * Admin: trigger an on-demand recompute.
 * all=true → recomputes all stale boards.
 * scope + optional eventId → recomputes one specific board.
 * Superadmin only.
 */
export async function adminRecomputeApi(params: {
  scope?: LeaderboardScope;
  eventId?: string;
  all?: boolean;
}): Promise<AdminRecomputeResponse> {
  const qs = buildParams(params as Record<string, unknown>);
  const res = await api.post<ApiResponse<AdminRecomputeResponse>>(
    `/api/v1/leaderboard/admin/leaderboard/recompute?${qs}`,
  );
  return res.data.data;
}
