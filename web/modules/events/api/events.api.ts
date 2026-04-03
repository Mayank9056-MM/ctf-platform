// Query string builder

import { api } from "@/shared/lib/api";
import { ApiResponse } from "@/shared/types/api.types";
import {
  AdminEventListFilters,
  AutoTransitionResult,
  CreateEventPayload,
  Event,
  EventDetailedStats,
  EventLeaderboard,
  EventListFilters,
  EventSummary,
  LeaderboardFilters,
  PaginationMeta,
  UpdateEventPayload,
} from "../types/event.type";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// PLAYER ROUTES

// GET /events
/**
 * Public paginated event list.
 * Players see non-draft, non-archived events.
 * Optional auth — annotates isRegistered when authenticated.
 */
export async function getEventsApi(
  filters: EventListFilters = {},
): Promise<{ events: EventSummary[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`/events?${params}`);
  return {
    events: res.data.data.events,
    meta: res.data.data.meta,
  };
}

// GET /events/:idOrSlug
/**
 * Full event detail by ID or slug.
 * Annotates isOrganizer and isRegistered when authenticated.
 * inviteCode is only returned to organizers/admins.
 */
export async function getEventDetailApi(idOrSlug: string): Promise<Event> {
  const res = await api.get<ApiResponse<Event>>(`/events/${idOrSlug}`);
  return res.data.data;
}

// POST /events/:id/register
/**
 * Register the authenticated user (and their team) for an event.
 * Requires auth. Body: { inviteCode? } — required when visibility === "invite".
 */
export async function registerForEventApi(
  eventId: string,
  inviteCode?: string,
): Promise<void> {
  await api.post(`/events/${eventId}/register`, { inviteCode });
}

// GET /events/:id/leaderboard
/**
 * Event leaderboard — user or team mode.
 * Public — no auth required.
 * Respects scoreboardFrozen: frozen boards return data as of freeze timestamp.
 */
export async function getEventLeaderboardApi(
  eventId: string,
  filters: LeaderboardFilters = {},
): Promise<EventLeaderboard> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<EventLeaderboard>>(
    `/events/${eventId}/leaderboard?${params}`,
  );
  return res.data.data;
}

// GET /events/:id/stats
/**
 * Aggregate event stats — solve counts, categories, activity chart.
 * Public — no auth required.
 */
export async function getEventStatsApi(
  eventId: string,
): Promise<EventDetailedStats> {
  const res = await api.get<ApiResponse<EventDetailedStats>>(
    `/events/${eventId}/stats`,
  );
  return res.data.data;
}

// ADMIN ROUTES

// GET /events/admin
/**
 * Admin paginated event list — includes drafts and archived.
 */
export async function adminGetEventsApi(
  filters: AdminEventListFilters = {},
): Promise<{ events: Event[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`/events/admin?${params}`);
  return {
    events: res.data.data.events,
    meta: res.data.data.meta,
  };
}

// POST /events/admin
/**
 * Create a new event. Saved as draft — transition to "scheduled" when ready.
 */
export async function adminCreateEventApi(
  payload: CreateEventPayload,
): Promise<Event> {
  const res = await api.post<ApiResponse<Event>>("/events/admin", payload);
  return res.data.data;
}

// PATCH /events/admin/:id
/**
 * Update event fields. Blocked on ended/archived events.
 */
export async function adminUpdateEventApi(
  id: string,
  payload: UpdateEventPayload,
): Promise<Event> {
  const res = await api.patch<ApiResponse<Event>>(
    `/events/admin/${id}`,
    payload,
  );
  return res.data.data;
}

// DELETE /events/admin/:id
/**
 * Hard-delete an event. Blocked on active events — end first.
 * Superadmin only.
 */
export async function adminDeleteEventApi(id: string): Promise<void> {
  await api.delete(`/events/admin/${id}`);
}

// POST /events/admin/:id/transition
/**
 * Transition event status. Enforces forward-only transition graph.
 * Body: { status: EventStatus }
 */
export async function adminTransitionEventApi(
  id: string,
  status: string,
): Promise<Event> {
  const res = await api.post<ApiResponse<Event>>(
    `/events/admin/${id}/transition`,
    { status },
  );
  return res.data.data;
}

// POST /events/admin/:id/scoreboard/freeze
/**
 * Freeze or unfreeze the scoreboard. Event must be active.
 * Body: { frozen: boolean }
 */
export async function adminFreezeScoreboardApi(
  id: string,
  frozen: boolean,
): Promise<Event> {
  const res = await api.post<ApiResponse<Event>>(
    `/events/admin/${id}/scoreboard/freeze`,
    { frozen },
  );
  return res.data.data;
}

// POST /events/admin/:id/challenges
/**
 * Add challenges to an event (additive — does not replace existing).
 * Body: { challengeIds: string[] }
 */
export async function adminAddChallengesApi(
  id: string,
  challengeIds: string[],
): Promise<Event> {
  const res = await api.post<ApiResponse<Event>>(
    `/events/admin/${id}/challenges`,
    { challengeIds },
  );
  return res.data.data;
}

// DELETE /events/admin/:id/challenges
/**
 * Remove challenges from an event.
 * Body: { challengeIds: string[] }
 */
export async function adminRemoveChallengesApi(
  id: string,
  challengeIds: string[],
): Promise<Event> {
  const res = await api.delete<ApiResponse<Event>>(
    `/events/admin/${id}/challenges`,
    { data: { challengeIds } },
  );
  return res.data.data;
}

// POST /events/admin/auto-transition
/**
 * Manually trigger the auto-transition cron logic.
 * Superadmin only. Recovery when cron misses a tick.
 */
export async function adminRunAutoTransitionsApi(): Promise<AutoTransitionResult> {
  const res = await api.post<ApiResponse<AutoTransitionResult>>(
    "/events/admin/auto-transition",
  );
  return res.data.data;
}
