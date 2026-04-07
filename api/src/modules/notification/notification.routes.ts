import express from "express";
import {
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminDeleteNotification,
  adminDispatch,
  adminGetNotificationById,
  adminGetNotifications,
  adminGetStats,
  adminMarkRead,
  clearMyInbox,
  deleteMyNotification,
  dismissBroadcast,
  getInboxSummary,
  getMyNotifications,
  getNotificationById,
  markAsRead,
} from "./notification.controller";

const notificationRouter = express.Router();

const adminGuard = [verifyAuth, requireRole("admin", "superadmin")];
const superAdminGuard = [verifyAuth, requireRole("superadmin")];

// ── Admin routes (declared before :id param routes) ───────────────────────────

/**
 * POST   /notifications/admin/dispatch         → send notification (admin)
 * GET    /notifications/admin                  → all notifications log
 * GET    /notifications/admin/stats            → aggregate stats
 * GET    /notifications/admin/:id              → single notification (admin view)
 * PATCH  /notifications/admin/:id/read         → mark read (admin)
 * DELETE /notifications/admin/:id              → hard delete (superadmin)
 */
notificationRouter.post("/admin/dispatch", adminGuard, adminDispatch);
notificationRouter.get("/admin", adminGuard, adminGetNotifications);
notificationRouter.get("/admin/stats", adminGuard, adminGetStats);
notificationRouter.get("/admin/:id", adminGuard, adminGetNotificationById);
notificationRouter.patch("/admin/:id/read", adminGuard, adminMarkRead);
notificationRouter.delete(
  "/admin/:id",
  superAdminGuard,
  adminDeleteNotification
);

// Player routes

/**
 * GET    /notifications/summary          → bell badge (unread count + previews)
 * GET    /notifications                  → full inbox (personal + broadcasts)
 * PATCH  /notifications/read             → mark specific/all as read
 * DELETE /notifications                  → clear entire inbox
 * GET    /notifications/:id              → single notification
 * POST   /notifications/:id/dismiss      → dismiss a broadcast
 * DELETE /notifications/:id              → soft-delete personal notification
 */
notificationRouter.get("/notifications/summary", verifyAuth, getInboxSummary);
notificationRouter.get("/", verifyAuth, getMyNotifications);
notificationRouter.patch("/read", verifyAuth, markAsRead);
notificationRouter.delete("/", verifyAuth, clearMyInbox);

notificationRouter.get("/:id", verifyAuth, getNotificationById);
notificationRouter.post("/:id/dismiss", verifyAuth, dismissBroadcast);
notificationRouter.delete("/:id", verifyAuth, deleteMyNotification);

export default notificationRouter;
