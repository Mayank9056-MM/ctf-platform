// Query string builder

import { ApiResponse } from "@/shared/types/api.types";
import {
  AdminDispatchPayload,
  AdminNotificationFilters,
  AppNotification,
  GetNotificationsFilters,
  InboxSummary,
  NotificationList,
  NotificationStats,
} from "../types/notification.types";
import { api } from "@/shared/lib/api";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// PLAYER ROUTES

//  GET /notifications/summary
/**
 * Bell badge — unread count + last 5 previews.
 * Lightweight endpoint designed to be polled every 30s.
 */
export async function getInboxSummaryApi(): Promise<InboxSummary> {
  const res = await api.get<ApiResponse<InboxSummary>>(
    "/api/v1/notification/notifications/summary",
  );
  return res.data.data;
}

// GET /notifications
/**
 * Full inbox — personal + active broadcasts merged.
 * Query: isRead?, type?, includeBroadcasts?, page, limit
 */
export async function getNotificationsApi(
  filters: GetNotificationsFilters = {},
): Promise<NotificationList> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<NotificationList>>(
    `/api/v1/notification/notifications?${params}`,
  );
  return res.data.data;
}

// GET /notifications/:id
/**
 * Single notification detail. Validates ownership on server.
 */
export async function getNotificationByIdApi(
  id: string,
): Promise<AppNotification> {
  const res = await api.get<ApiResponse<AppNotification>>(
    `/api/v1/notification/notifications/${id}`,
  );
  return res.data.data;
}

// PATCH /notifications/read
/**
 * Mark specific notifications as read.
 * If notificationIds is omitted or empty → marks ALL unread as read.
 */
export async function markNotificationsReadApi(
  notificationIds?: string[],
): Promise<{ updated: number }> {
  const body =
    notificationIds && notificationIds.length > 0 ? { notificationIds } : {};
  const res = await api.patch<ApiResponse<{ updated: number }>>(
    "/api/v1/notification/notifications/read",
    body,
  );
  return res.data.data;
}

// POST /notifications/:id/dismiss
/**
 * Dismiss a broadcast notification for the current user.
 * $addToSet — idempotent.
 */
export async function dismissNotificationApi(id: string): Promise<void> {
  await api.post(`/api/v1/notification/notifications/${id}/dismiss`);
}

// DELETE /notifications/:id
/**
 * Soft-delete a personal notification (removes from inbox).
 * Does not work on broadcasts — use dismiss for those.
 */
export async function deleteNotificationApi(id: string): Promise<void> {
  await api.delete(`/api/v1/notification/notifications/${id}`);
}

// DELETE /notifications
/**
 * Clear entire inbox — bulk soft-delete all personal notifications.
 * Broadcasts are excluded.
 */
export async function clearInboxApi(): Promise<{ cleared: number }> {
  const res = await api.delete<ApiResponse<{ cleared: number }>>(
    "/api/v1/notification/notifications",
  );
  return res.data.data;
}

// ADMIN ROUTES

// POST /notifications/admin/dispatch
/**
 * Send a targeted or broadcast notification.
 * recipientId: null | omit = broadcast
 */
export async function adminDispatchNotificationApi(
  payload: AdminDispatchPayload,
): Promise<AppNotification> {
  const res = await api.post<ApiResponse<AppNotification>>(
    "/api/v1/notification/notifications/admin/dispatch",
    payload,
  );
  return res.data.data;
}

// GET /notifications/admin
/**
 * Paginated log of all notifications across all users.
 */
export async function adminGetNotificationsApi(
  filters: AdminNotificationFilters = {},
): Promise<NotificationList> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get<ApiResponse<NotificationList>>(
    `/api/v1/notification/notifications/admin?${params}`,
  );
  return res.data.data;
}

// GET /notifications/admin/stats
/**
 * Aggregate stats — total, broadcasts, unread, by type, by channel, activity.
 */
export async function adminGetNotificationStatsApi(): Promise<NotificationStats> {
  const res = await api.get<ApiResponse<NotificationStats>>(
    "/api/v1/notification/notifications/admin/stats",
  );
  return res.data.data;
}

// GET /notifications/admin/:id
/**
 * Full detail for a single notification — admin view with populated recipient.
 */
export async function adminGetNotificationByIdApi(
  id: string,
): Promise<AppNotification> {
  const res = await api.get<ApiResponse<AppNotification>>(
    `/api/v1/notification/notifications/admin/${id}`,
  );
  return res.data.data;
}

// PATCH /notifications/admin/:id/read
/**
 * Mark a notification as read on behalf of a user — support operations.
 */
export async function adminMarkNotificationReadApi(
  id: string,
): Promise<AppNotification> {
  const res = await api.patch<ApiResponse<AppNotification>>(
    `/api/v1/notification/notifications/admin/${id}/read`,
  );
  return res.data.data;
}

// DELETE /notifications/admin/:id
/**
 * Hard-delete. Superadmin only. For GDPR / content removal.
 */
export async function adminDeleteNotificationApi(id: string): Promise<void> {
  await api.delete(`/api/v1/notification/notifications/admin/${id}`);
}
