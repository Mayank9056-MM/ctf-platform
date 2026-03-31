// Query string builder

import { api } from "@/shared/lib/api";
import { AdminAnnouncementFilters, AdminAnnouncementList, Announcement, AnnouncementFeed, AnnouncementFeedFilters, AnnouncementStats, CreateAnnouncementPayload, RetractAnnouncementPayload, UpdateAnnouncementPayload } from "../types/announcement.types";
import { ApiResponse } from "@/shared/types/api.types";

function buildParams(filters: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val));
    }
  }
  return params;
}

//  GET /announcements

export async function getAnnouncementFeedApi(
  filters: AnnouncementFeedFilters = {},
): Promise<AnnouncementFeed> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<AnnouncementFeed>>(
    `/announcements?${params}`,
  );
  return res.data.data;
}

//  GET /announcements/challenge/:challengeId

export async function getChallengeAnnouncementsApi(
  challengeId: string,
): Promise<AnnouncementFeed> {
  const res = await api.get<ApiResponse<AnnouncementFeed>>(
    `/announcements/challenge/${challengeId}`,
  );
  return res.data.data;
}

// POST /announcements/:id/dismiss

export async function dismissAnnouncementApi(id: string): Promise<void> {
  await api.post(`/announcements/${id}/dismiss`);
}

// ADMIN ROUTES

// GET /announcements/admin

export async function adminGetAnnouncementsApi(
  filters: AdminAnnouncementFilters = {},
): Promise<AdminAnnouncementList> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<AdminAnnouncementList>>(
    `/announcements/admin?${params}`,
  );
  return res.data.data;
}

// GET /announcements/admin/stats

export async function adminGetAnnouncementStatsApi(): Promise<AnnouncementStats> {
  const res = await api.get<ApiResponse<AnnouncementStats>>(
    "/announcements/admin/stats",
  );
  return res.data.data;
}

// POST /announcements/admin

export async function adminCreateAnnouncementApi(
  payload: CreateAnnouncementPayload,
): Promise<Announcement> {
  const res = await api.post<ApiResponse<Announcement>>(
    "/announcements/admin",
    payload,
  );
  return res.data.data;
}

// GET /announcements/admin/:id

export async function adminGetAnnouncementByIdApi(
  id: string,
): Promise<Announcement> {
  const res = await api.get<ApiResponse<Announcement>>(
    `/announcements/admin/${id}`,
  );
  return res.data.data;
}

// PATCH /announcements/admin/:id

export async function adminUpdateAnnouncementApi(
  id: string,
  payload: UpdateAnnouncementPayload,
): Promise<Announcement> {
  const res = await api.patch<ApiResponse<Announcement>>(
    `/announcements/admin/${id}`,
    payload,
  );
  return res.data.data;
}

// POST /announcements/admin/:id/publish

export async function adminPublishAnnouncementApi(
  id: string,
): Promise<Announcement> {
  const res = await api.post<ApiResponse<Announcement>>(
    `/announcements/admin/${id}/publish`,
  );
  return res.data.data;
}

// POST /announcements/admin/:id/retract

export async function adminRetractAnnouncementApi(
  id: string,
  payload: RetractAnnouncementPayload = {},
): Promise<Announcement> {
  const res = await api.post<ApiResponse<Announcement>>(
    `/announcements/admin/${id}/retract`,
    payload,
  );
  return res.data.data;
}

// DELETE /announcements/admin/:id

export async function adminDeleteAnnouncementApi(id: string): Promise<void> {
  await api.delete(`/announcements/admin/${id}`);
}

// POST /announcements/admin/dispatch-queue

export async function adminRunDispatchQueueApi(): Promise<{
  processed: number;
  failed: number;
}> {
  const res = await api.post<ApiResponse<{ processed: number; failed: number }>>(
    "/announcements/admin/dispatch-queue",
  );
  return res.data.data;
}
