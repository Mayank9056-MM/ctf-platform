import { ApiResponse } from "@/shared/types/api.types";
import {
  GraphValidationResult,
  NodeCompleteResult,
  PaginationMeta,
  Story,
  StoryLeaderboardEntry,
  StoryListFilters,
  StoryProgressView,
  StorySummary,
} from "../types/story.types";
import { api } from "@/shared/lib/api";
import {
  AddCharacterFormData,
  CreateChapterFormData,
  CreateNodeFormData,
  CreateStoryFormData,
  MakeChoiceFormData,
  SetStoryStatusFormData,
  UpdateChapterFormData,
  UpdateNodeFormData,
  UpdateStoryFormData,
} from "../schemas/story.schema";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// PLAYER ROUTES

// GET /stories
export async function getStoriesApi(
  filters: StoryListFilters = {},
): Promise<{ stories: StorySummary[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<
    ApiResponse<{ stories: StorySummary[]; meta: PaginationMeta }>
  >(`/api/v1/story?${params}`);

  console.log(res.data.data, "from get stories api");

  return { stories: res.data.data.stories, meta: res.data.data.meta };
}

// GET /stories/:idOrSlug
export async function getStoryDetailApi(idOrSlug: string): Promise<Story> {
  console.log(idOrSlug, "from get story detail api");
  const res = await api.get<ApiResponse<Story>>(`/api/v1/story/${idOrSlug}`);
  console.log(res.data.data, "from get story detail api");
  return res.data.data;
}

// POST /stories/:id/start
export async function startStoryApi(id: string): Promise<StoryProgressView> {
  console.log("start story api");
  const res = await api.post<ApiResponse<StoryProgressView>>(
    `/api/v1/story/${id}/start`,
  );
  console.log(res, "from start story api");
  return res.data.data;
}

// GET /stories/:id/progress
export async function getStoryProgressApi(
  id: string,
): Promise<StoryProgressView | null> {
  const res = await api.get<ApiResponse<StoryProgressView | null>>(
    `/api/v1/story/${id}/progress`,
  );
  return res.data.data;
}

// GET /stories/:id/leaderboard
export async function getStoryLeaderboardApi(
  id: string,
  page = 1,
  limit = 20,
): Promise<{ entries: StoryLeaderboardEntry[]; meta: PaginationMeta }> {
  const res = await api.get(
    `/api/v1/story/${id}/leaderboard?page=${page}&limit=${limit}`,
  );
  return { entries: res.data.data.entries, meta: res.data.data.meta };
}

// POST /stories/:id/chapters/:chapterId/nodes/:nodeId/advance
export async function advanceNodeApi(
  storyId: string,
  chapterId: string,
  nodeId: string,
  elapsedSeconds = 0,
): Promise<NodeCompleteResult> {
  const res = await api.post<ApiResponse<NodeCompleteResult>>(
    `/api/v1/story/${storyId}/chapters/${chapterId}/nodes/${nodeId}/advance`,
    { elapsedSeconds },
  );
  return res.data.data;
}

// POST /stories/:id/chapters/:chapterId/nodes/:nodeId/choose
export async function makeChoiceApi(
  storyId: string,
  chapterId: string,
  nodeId: string,
  payload: MakeChoiceFormData,
): Promise<NodeCompleteResult> {
  const res = await api.post<ApiResponse<NodeCompleteResult>>(
    `/api/v1/story/${storyId}/chapters/${chapterId}/nodes/${nodeId}/choose`,
    payload,
  );
  return res.data.data;
}

// ADMIN — Story

// POST /stories/admin
export async function adminCreateStoryApi(
  payload: CreateStoryFormData,
): Promise<Story> {
  const res = await api.post<ApiResponse<Story>>(
    "/api/v1/story/admin",
    payload,
  );
  return res.data.data;
}

// PATCH /stories/admin/:id
export async function adminUpdateStoryApi(
  id: string,
  payload: UpdateStoryFormData,
): Promise<Story> {
  const res = await api.patch<ApiResponse<Story>>(
    `/api/v1/story/admin/${id}`,
    payload,
  );
  return res.data.data;
}

// PATCH /stories/admin/:id/status
export async function adminSetStoryStatusApi(
  id: string,
  payload: SetStoryStatusFormData,
): Promise<Story> {
  const res = await api.patch<ApiResponse<Story>>(
    `/api/v1/story/admin/${id}/status`,
    payload,
  );
  return res.data.data;
}

// DELETE /stories/admin/:id
export async function adminDeleteStoryApi(id: string): Promise<void> {
  await api.delete(`/api/v1/story/admin/${id}`);
}

// POST /stories/admin/:id/characters
export async function adminAddCharacterApi(
  id: string,
  payload: AddCharacterFormData,
): Promise<Story> {
  const res = await api.post<ApiResponse<Story>>(
    `/api/v1/story/admin/${id}/characters`,
    payload,
  );
  return res.data.data;
}

// DELETE /stories/admin/:id/characters/:characterId
export async function adminRemoveCharacterApi(
  id: string,
  characterId: string,
): Promise<Story> {
  const res = await api.delete<ApiResponse<Story>>(
    `/api/v1/story/admin/${id}/characters/${characterId}`,
  );
  return res.data.data;
}

// Admin — Chapter

// POST /stories/admin/:id/chapters
export async function adminCreateChapterApi(
  storyId: string,
  payload: CreateChapterFormData,
): Promise<Story> {
  const res = await api.post<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters`,
    payload,
  );

  return res.data.data;
}

// PATCH /stories/admin/:id/chapters/:chapterId
export async function adminUpdateChapterApi(
  storyId: string,
  chapterId: string,
  payload: UpdateChapterFormData,
): Promise<Story> {
  const res = await api.patch<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}`,
    payload,
  );
  return res.data.data;
}

// DELETE /stories/admin/:id/chapters/:chapterId
export async function adminDeleteChapterApi(
  storyId: string,
  chapterId: string,
): Promise<Story> {
  const res = await api.delete<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}`,
  );
  return res.data.data;
}

// GET /stories/admin/:id/chapters/:chapterId/validate
export async function adminValidateChapterApi(
  storyId: string,
  chapterId: string,
): Promise<GraphValidationResult> {
  console.log(storyId, chapterId, "from admin validate chapter api");
  const res = await api.get<ApiResponse<GraphValidationResult>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}/validate`,
  );

  console.log(res, "from admin validate chapter api");

  return res.data.data;
}

// POST /stories/admin/:id/chapters/:chapterId/publish
export async function adminPublishChapterApi(
  storyId: string,
  chapterId: string,
): Promise<Story> {
  const res = await api.post<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}/publish`,
  );
  return res.data.data;
}

// Admin — Node

// POST /stories/admin/:id/chapters/:chapterId/nodes
export async function adminCreateNodeApi(
  storyId: string,
  chapterId: string,
  payload: CreateNodeFormData,
): Promise<Story> {
  console.log("calling admin create node api");
  const res = await api.post<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}/nodes`,
    payload,
  );
  console.log(res, "from admin create node api");
  return res.data.data;
}

// PATCH /stories/admin/:id/chapters/:chapterId/nodes/:nodeId
export async function adminUpdateNodeApi(
  storyId: string,
  chapterId: string,
  nodeId: string,
  payload: UpdateNodeFormData,
): Promise<Story> {
  const res = await api.patch<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}/nodes/${nodeId}`,
    payload,
  );
  return res.data.data;
}

// DELETE /stories/admin/:id/chapters/:chapterId/nodes/:nodeId
export async function adminDeleteNodeApi(
  storyId: string,
  chapterId: string,
  nodeId: string,
): Promise<Story> {
  const res = await api.delete<ApiResponse<Story>>(
    `/api/v1/story/admin/${storyId}/chapters/${chapterId}/nodes/${nodeId}`,
  );
  return res.data.data;
}

export async function adminGetStoryApi(id: string): Promise<Story> {
  const res = await api.get<ApiResponse<Story>>(`/api/v1/story/admin/${id}`);
  return res.data.data;
}
