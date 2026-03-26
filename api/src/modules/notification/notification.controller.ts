import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { notificationService } from "./notification.service";
import {
  adminDispatchSchema,
  adminNotificationFiltersSchema,
  getNotificationsSchema,
  markReadSchema,
} from "./notification.validate";

/**
 * GET /notifications
 * Authenticated user's inbox — personal + active broadcasts merged.
 * Query: isRead, type, includeBroadcasts, page, limit
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const filters = parseBody(getNotificationsSchema, req.query);

  const result = await notificationService.getMyNotifications(
    req.user!._id,
    filters
  );

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while get users notifications"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications retrieved"));
});

/**
 * GET /notifications/summary
 * Unread count + last 5 notifications for the notification bell.
 * Lightweight — designed to be polled frequently.
 */
const getInboxSummary = asyncHandler(async (req, res) => {
  const summary = await notificationService.getInboxSummary(req.user!._id);

  if (!summary) {
    throw new ApiError(500, "Something went wrong while getting inbox summary");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Inbox summary retrieved"));
});

/**
 * GET /notifications/:id
 * Single notification detail.
 * Validates ownership — users can only read their own notifications and broadcasts.
 */
const getNotificationById = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const notification = await notificationService.getNotificationById(
    id,
    req.user!._id
  );

  if (!notification) {
    throw new ApiError(500, "Something went wrong while getting notification");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification retrieved"));
});

/**
 * PATCH /notifications/read
 * Mark specific notifications as read.
 * Body: { notificationIds: string[] }  — omit to mark ALL as read.
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = parseBody(markReadSchema, req.body) as {
    notificationIds?: string[];
  };

  let updated: number;

  if (notificationIds && notificationIds.length > 0) {
    updated = await notificationService.markAsRead(
      notificationIds,
      req.user!._id
    );
  } else {
    updated = await notificationService.markAllAsRead(req.user!._id);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updated },
        updated === 0
          ? "No unread notifications to mark"
          : `${updated} notification(s) marked as read`
      )
    );
});

/**
 * POST /notifications/:id/dismiss
 * Dismiss a broadcast notification so it no longer shows in the inbox.
 * Only works on broadcast notifications (recipient = null).
 */
const dismissBroadcast = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  await notificationService.dismissBroadcast(id, req.user!._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Broadcast notification dismissed"));
});

/**
 * DELETE /notifications/:id
 * Soft-delete a personal notification (removes from inbox).
 * Does not work on broadcasts — use dismiss for those.
 */
const deleteMyNotification = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  await notificationService.deleteMyNotification(id, req.user!._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification removed from inbox"));
});

/**
 * DELETE /notifications
 * Clear entire inbox (soft-delete all personal notifications).
 */
const clearMyInbox = asyncHandler(async (req, res) => {
  const cleared = await notificationService.clearMyInbox(req.user!._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { cleared },
        `Inbox cleared — ${cleared} notification(s) removed`
      )
    );
});

// Admin Controllers

/**
 * POST /admin/notifications/dispatch
 * Send a targeted or broadcast notification.
 * Body: { recipientId?, type, title, body, channels?, actionUrl?, expiresAt?, ref? }
 * recipientId: null or omitted = broadcast to all
 */
const adminDispatch = asyncHandler(async (req, res) => {
  const data = parseBody(adminDispatchSchema, req.body) as Parameters<
    typeof notificationService.adminDispatch
  >[0];

  const notification = await notificationService.adminDispatch({
    ...data,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!notification) {
    throw new ApiError(
      500,
      "Something went wrong while dispatching notification"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        notification,
        data.recipientId
          ? "Notification dispatched to user"
          : "Broadcast notification dispatched to all users"
      )
    );
});

/**
 * GET /admin/notifications
 * Paginated notification log — all users, all types.
 * Query: recipientId, type, channel, isRead, isBroadcast, from, to, page, limit
 */
const adminGetNotifications = asyncHandler(async (req, res) => {
  const filters = parseBody(adminNotificationFiltersSchema, req.query);

  const result = await notificationService.getAdminNotifications(filters);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications retrieved"));
});

/**
 * GET /admin/notifications/stats
 * Aggregate notification stats — totals, by type, by channel, activity.
 */
const adminGetStats = asyncHandler(async (_req, res) => {
  const stats = await notificationService.getAdminStats();

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Notification stats retrieved"));
});

/**
 * GET /admin/notifications/:id
 * Full notification detail with populated recipient.
 */
const adminGetNotificationById = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const notification = await notificationService.getAdminNotificationById(id);

  if (!notification) {
    throw new ApiError(500, "Something went wrong while fetching notification");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification retrieved"));
});

/**
 * PATCH /admin/notifications/:id/read
 * Mark a notification as read on behalf of a user (support ops).
 */
const adminMarkRead = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const notification = await notificationService.adminMarkRead(
    id,
    req.user!._id,
    req.user!.username
  );

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

/**
 * DELETE /admin/notifications/:id
 * Hard-delete. For GDPR / content removal. Superadmin only.
 */
const adminDeleteNotification = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  await notificationService.adminDeleteNotification(
    id,
    req.user!._id,
    req.user!.username
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification permanently deleted"));
});

export {
  getMyNotifications,
  getInboxSummary,
  getNotificationById,
  markAsRead,
  dismissBroadcast,
  deleteMyNotification,
  clearMyInbox,
  adminDispatch,
  adminGetNotifications,
  adminGetStats,
  adminGetNotificationById,
  adminMarkRead,
  adminDeleteNotification,
};
