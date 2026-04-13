// Query string builder

import { api } from "@/shared/lib/api";
import {
  AddHintInput,
  AdminChallenge,
  AdminChallengeStats,
  Challenge,
  ChallengeFilters,
  ChallengeSolve,
  ChallengeSubmission,
  ChallengeSummary,
  CreateChallengeInput,
  PaginationMeta,
  PurchasedHintResult,
  UpdateChallengeInput,
} from "../types/challenge.types";
import { ApiResponse } from "@/shared/types/api.types";

function buildParams(filters: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return params;
}

// GET /challenges

export async function getChallengesApi(
  filters: ChallengeFilters = {},
): Promise<{ challenges: ChallengeSummary[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);

  const res = await api.get<
    ApiResponse<{ challenges: ChallengeSummary[]; meta: PaginationMeta }>
  >(`api/v1/challenges?${params}`);

  return res.data.data;
}

// GET /challenges/:idOrSlug

export async function getChallengeDetailApi(
  idOrSlug: string,
): Promise<Challenge> {
  const res = await api.get<ApiResponse<Challenge>>(
    `api/v1/challenges/${idOrSlug}`,
  );

  return res.data.data;
}

// POST /challenges/:id/hints

export async function purchaseHintApi(
  challengeId: string,
  hintIndex: number,
): Promise<PurchasedHintResult> {
  const res = await api.post<ApiResponse<PurchasedHintResult>>(
    `api/v1/challenges/${challengeId}/hints`,
    { hintIndex },
  );
  return res.data.data;
}

// GET /challenges/:id/solves

export async function getChallengeSolvesApi(
  challengeId: string,
  page = 1,
  limit = 20,
): Promise<{ solves: ChallengeSolve[]; meta: PaginationMeta }> {
  const res = await api.get(
    `api/v1/challenges/${challengeId}/solves?page=${page}&limit=${limit}`,
  );
  return {
    solves: res.data.data.solves,
    meta: res.data.data.meta,
  };
}

// ADMIN ROUTES

// GET /challenges/admin

export async function adminGetChallengesApi(
  filters: ChallengeFilters = {},
): Promise<{ challenges: AdminChallenge[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);

  const res = await api.get<
    ApiResponse<{ challenges: AdminChallenge[]; meta: PaginationMeta }>
  >(`api/v1/challenges/admin?${params}`);

  return res.data.data;
}

// GET /challenges/admin/stats

export async function adminGetChallengeStatsApi(): Promise<AdminChallengeStats> {
  const res = await api.get<ApiResponse<AdminChallengeStats>>(
    "api/v1/challenges/admin/stats",
  );
  return res.data.data;
}

// POST /challenges/admin

export async function adminCreateChallengeApi(
  data: CreateChallengeInput,
): Promise<AdminChallenge> {

  const res = await api.post<ApiResponse<AdminChallenge>>(
    "api/v1/challenges/admin",
    data,
  );

  return res.data.data;
}

// PATCH /challenges/admin/:id

export async function adminUpdateChallengeApi(
  id: string,
  data: UpdateChallengeInput,
): Promise<AdminChallenge> {

  const res = await api.patch<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}`,
    data,
  );
  return res.data.data;
}

// DELETE /challenges/admin/:id

export async function adminDeleteChallengeApi(id: string): Promise<void> {
  await api.delete(`api/v1/challenges/admin/${id}`);
}

// PATCH /challenges/admin/:id/publish

export async function adminPublishChallengeApi(
  id: string,
): Promise<AdminChallenge> {
  const res = await api.patch<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}/publish`,
  );

  return res.data.data;
}

// PATCH /challenges/admin/:id/unpublish

export async function adminUnpublishChallengeApi(
  id: string,
): Promise<AdminChallenge> {
  const res = await api.patch<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}/unpublish`,
  );
  return res.data.data;
}

// POST /challenges/admin/:id/hints

export async function adminAddHintApi(
  id: string,
  hint: AddHintInput,
): Promise<AdminChallenge> {

  const res = await api.post<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}/hints`,
    hint,
  );
  return res.data.data;
}

// DELETE /challenges/admin/:id/hints/:hintIndex

export async function adminRemoveHintApi(
  id: string,
  hintIndex: number,
): Promise<AdminChallenge> {
  const res = await api.delete<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}/hints/${hintIndex}`,
  );
  return res.data.data;
}

// POST /challenges/admin/:id/attachments

export async function adminAddAttachmentApi(
  id: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<AdminChallenge> {
  const form = new FormData();
  form.append("file", file);
  form.append("name", file.name);

  const res = await api.post<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}/attachments`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );

  return res.data.data;
}

// DELETE /challenges/admin/:id/attachments/:attachmentId

export async function adminRemoveAttachmentApi(
  id: string,
  attachmentId: string,
): Promise<AdminChallenge> {
  const res = await api.delete<ApiResponse<AdminChallenge>>(
    `api/v1/challenges/admin/${id}/attachments/${attachmentId}`,
  );
  return res.data.data;
}

// GET /challenges/admin/:id/submissions

export async function adminGetChallengeSubmissionsApi(
  id: string,
  page = 1,
  limit = 20,
  isCorrect?: boolean,
): Promise<{ submissions: ChallengeSubmission[]; meta: PaginationMeta }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (isCorrect !== undefined) params.set("isCorrect", String(isCorrect));

  const res = await api.get(
    `api/v1/challenges/admin/${id}/submissions?${params}`,
  );

  return {
    submissions: res.data.data.submissions,
    meta: res.data.data.meta,
  };
}
