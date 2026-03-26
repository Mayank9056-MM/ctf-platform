import express from "express";
import {
  optionalAuth,
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminAddChallenges,
  adminCreateEvent,
  adminDeleteEvent,
  adminFreezeScoreboard,
  adminGetEvents,
  adminRemoveChallenges,
  adminRunAutoTransitions,
  adminTransitionEvent,
  adminUpdateEvent,
  getEventDetail,
  getEventLeaderboard,
  getEvents,
  getEventStats,
  registerForEvent,
} from "./event.controller";

const adminGuard = [verifyAuth, requireRole("admin", "superadmin")];
const superAdminGuard = [verifyAuth, requireRole("superadmin")];

const eventRouter = express.Router();
/**
 * GET    /events/admin                         → all events including drafts
 * POST   /events/admin                         → create event
 * POST   /events/admin/auto-transition         → trigger cron manually (superadmin)
 * PATCH  /events/admin/:id                     → update event
 * DELETE /events/admin/:id                     → delete event (superadmin)
 * POST   /events/admin/:id/transition          → status transition
 * POST   /events/admin/:id/scoreboard/freeze   → freeze/unfreeze scoreboard
 * POST   /events/admin/:id/challenges          → add challenges
 * DELETE /events/admin/:id/challenges          → remove challenges
 */
eventRouter.get("/admin", adminGuard, adminGetEvents);
eventRouter.post("/admin", adminGuard, adminCreateEvent);
eventRouter.post(
  "/admin/auto-transition",
  superAdminGuard,
  adminRunAutoTransitions
);

eventRouter.patch("/admin/:id", adminGuard, adminUpdateEvent);
eventRouter.delete("/admin/:id", superAdminGuard, adminDeleteEvent);
eventRouter.post("/admin/:id/transition", adminGuard, adminTransitionEvent);
eventRouter.post(
  "/admin/:id/scoreboard/freeze",
  adminGuard,
  adminFreezeScoreboard
);
eventRouter.post("/admin/:id/challenges", adminGuard, adminAddChallenges);
eventRouter.delete("/admin/:id/challenges", adminGuard, adminRemoveChallenges);

// ── Player routes ─────────────────────────────────────────────────────────────

/**
 * GET  /events                     → public event list
 * GET  /events/:idOrSlug           → event detail
 * POST /events/:id/register        → register for event (auth required)
 * GET  /events/:id/leaderboard     → leaderboard (public, respects freeze)
 * GET  /events/:id/stats           → event stats (public)
 */
eventRouter.get("/", optionalAuth, getEvents);
eventRouter.get("/:idOrSlug", optionalAuth, getEventDetail);
eventRouter.post("/:id/register", verifyAuth, registerForEvent);
eventRouter.get("/:id/leaderboard", getEventLeaderboard);
eventRouter.get("/:id/stats", getEventStats);

export default eventRouter;
