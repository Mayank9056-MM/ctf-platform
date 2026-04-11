import express from "express";
import {
  optionalAuth,
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminCreate,
  adminDelete,
  adminGetAnnouncements,
  adminGetById,
  adminGetStats,
  adminPublish,
  adminRetract,
  adminRunDispatchQueue,
  adminUpdate,
  dismissAnnouncement,
  getChallengeAnnouncements,
  getFeed,
} from "./announcement.controller";

const announcementRouter = express.Router();

const adminGuard = [verifyAuth, requireRole("admin", "superadmin")];
const superAdminGuard = [verifyAuth, requireRole("superadmin")];

// Admin routes (declared before parameterised player routes)

/**
 * GET    /announcements/admin                  → all announcements (admin)
 * GET    /announcements/admin/stats            → aggregate stats
 * POST   /announcements/admin                  → create announcement
 * POST   /announcements/admin/dispatch-queue   → run dispatch queue (superadmin)
 * GET    /announcements/admin/:id              → full detail (admin)
 * PATCH  /announcements/admin/:id              → update fields
 * POST   /announcements/admin/:id/publish      → publish draft
 * POST   /announcements/admin/:id/retract      → retract announcement
 * DELETE /announcements/admin/:id              → hard delete (superadmin)
 */
announcementRouter.get(
  "/announcements/admin",
  adminGuard,
  adminGetAnnouncements
);
announcementRouter.get("/announcements/admin/stats", adminGuard, adminGetStats);
announcementRouter.post("/announcements/admin", adminGuard, adminCreate);
announcementRouter.post(
  "/announcements/admin/dispatch-queue",
  superAdminGuard,
  adminRunDispatchQueue
);

announcementRouter.get("/announcements/admin/:id", adminGuard, adminGetById);
announcementRouter.patch("/announcements/admin/:id", adminGuard, adminUpdate);
announcementRouter.post(
  "/announcements/admin/:id/publish",
  adminGuard,
  adminPublish
);
announcementRouter.post(
  "/announcements/admin/:id/retract",
  adminGuard,
  adminRetract
);
announcementRouter.delete(
  "/announcements/admin/:id",
  superAdminGuard,
  adminDelete
);

// Player routes

/**
 * GET  /announcements
 *   → Participant feed. Optional auth: unauthenticated = "all" audience only.
 *   Query: severity?, challengeId?, page, limit
 *
 * GET  /announcements/challenge/:challengeId
 *   → Challenge-scoped announcements. No auth required.
 *
 * POST /announcements/:id/dismiss
 *   → Dismiss an announcement from the feed. Auth required.
 */
announcementRouter.get("/announcements/", optionalAuth, getFeed);
announcementRouter.get(
  "/announcements/challenge/:challengeId",
  getChallengeAnnouncements
);
announcementRouter.post(
  "/announcements/:id/dismiss",
  verifyAuth,
  dismissAnnouncement
);

export default announcementRouter;
