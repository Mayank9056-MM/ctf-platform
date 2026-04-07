import { ApiResponse } from "@/shared/types/api.types";
import {
  AdminStatsFilters,
  AdminSubmissionsFilters,
  AdminSubmissionStats,
  ChallengeHistoryEntry,
  ChallengeSolveEntry,
  MySubmission,
  MySubmissionsFilters,
  PaginationMeta,
  Submission,
  SubmitFlagResult,
  UserSubmissionStats,
} from "../types/submission.types";
import { api } from "@/shared/lib/api";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// PLAYER ROUTES

// POST /challenges/:challengeId/submit

/**
 * Submit a flag. Returns 200 on correct, 400 on incorrect.
 * Rate-limited at service layer (5 wrong / min per user per challenge).
 * Requires verified account.
 */
export async function submitFlagApi(
  challengeId: string,
  flag: string,
): Promise<SubmitFlagResult> {
  const res = await api.post<ApiResponse<SubmitFlagResult>>(
    `/api/v1/submission/challenges/${challengeId}/submit`,
    { flag },
  );
  return res.data.data;
}

// GET /submissions/me

/**
 * Own submission history.
 * Query: isCorrect?, challengeId?, sortOrder?, page, limit
 */
export async function getMySubmissionsApi(
  filters: MySubmissionsFilters = {},
): Promise<{ submissions: MySubmission[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`/api/v1/submission/submissions/me?${params}`);
  return {
    submissions: res.data.data.submissions,
    meta: res.data.data.meta,
  };
}

//  GET /submissions/me/stats

/**
 * Own submission stats — score, rank, streak, solve rate, 30-day activity.
 */
export async function getMyStatsApi(): Promise<UserSubmissionStats> {
  const res = await api.get<ApiResponse<UserSubmissionStats>>(
    "/api/v1/submission/submissions/me/stats",
  );
  return res.data.data;
}

// GET /challenges/:challengeId/history

/**
 * Own attempt history for a single challenge (correct + incorrect).
 * Useful for the challenge detail page to show past attempts.
 */
export async function getChallengeHistoryApi(
  challengeId: string,
  page = 1,
  limit = 20,
): Promise<{ submissions: ChallengeHistoryEntry[]; meta: PaginationMeta }> {
  const res = await api.get(
    `/api/v1/submission/challenges/${challengeId}/history?page=${page}&limit=${limit}`,
  );
  return {
    submissions: res.data.data.submissions,
    meta: res.data.data.meta,
  };
}

// GET /challenges/:challengeId/solves

/**
 * Public solve leaderboard for a challenge.
 * Sorted oldest-first — rank 1 = first solver.
 * No auth required.
 */
export async function getChallengeSolvesApi(
  challengeId: string,
  page = 1,
  limit = 20,
): Promise<{ solves: ChallengeSolveEntry[]; meta: PaginationMeta }> {
  const res = await api.get(
    `/api/v1/submission/challenges/${challengeId}/solves?page=${page}&limit=${limit}`,
  );
  return {
    solves: res.data.data.solves,
    meta: res.data.data.meta,
  };
}

// ADMIN ROUTES

//  GET /admin/submissions

/**
 * Platform-wide paginated submission log.
 * All filters: isCorrect, isFirstBlood, userId, teamId, challengeId,
 * ipAddress, from, to, sortBy, sortOrder, page, limit.
 */
export async function adminGetSubmissionsApi(
  filters: AdminSubmissionsFilters = {},
): Promise<{ submissions: Submission[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`/api/v1/submission/admin/submissions?${params}`);
  return {
    submissions: res.data.data.submissions,
    meta: res.data.data.meta,
  };
}

// GET /admin/submissions/stats

/**
 * Aggregate analytics stats — by category, activity by day, top solvers.
 * Query: from?, to?, challengeId?
 */
export async function adminGetSubmissionStatsApi(
  filters: AdminStatsFilters = {},
): Promise<AdminSubmissionStats> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<AdminSubmissionStats>>(
    `/api/v1/submission/admin/submissions/stats?${params}`,
  );
  return res.data.data;
}

// GET /admin/submissions/:submissionId

/**
 * Full submission detail — includes IP address and user agent.
 * flagHash is never exposed even to admins.
 */
export async function adminGetSubmissionByIdApi(
  submissionId: string,
): Promise<Submission> {
  const res = await api.get<ApiResponse<Submission>>(
    `/api/v1/submission/admin/submissions/${submissionId}`,
  );
  return res.data.data;
}

// DELETE /admin/submissions/:submissionId

/**
 * Delete a submission and reverse its points award.
 * Cascades: removes from user.solvedChallenges, decrements challenge.solveCount,
 * unsets firstBlood if applicable. Superadmin only. Irreversible.
 */
export async function adminDeleteSubmissionApi(
  submissionId: string,
): Promise<void> {
  await api.delete(`/api/v1/submission/admin/submissions/${submissionId}`);
}

// GET /admin/users/:userId/submissions

/**
 * All submissions for a specific user — used on the admin user detail page.
 * Query: isCorrect?, page, limit
 */
export async function adminGetUserSubmissionsApi(
  userId: string,
  page = 1,
  limit = 20,
  isCorrect?: boolean,
): Promise<{ submissions: Submission[]; meta: PaginationMeta }> {
  const params = buildParams({
    page,
    limit,
    ...(isCorrect !== undefined && { isCorrect }),
  });
  const res = await api.get(`/api/v1/submission/admin/users/${userId}/submissions?${params}`);
  return {
    submissions: res.data.data.submissions,
    meta: res.data.data.meta,
  };
}
