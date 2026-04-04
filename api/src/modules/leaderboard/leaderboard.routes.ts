import express from "express";
import {
  optionalAuth,
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminRecompute,
  getLeaderboard,
  getMyRank,
} from "./leaderboard.controller";

const leaderboardRouter = express.Router();

const superAdminGuard = [verifyAuth, requireRole("superadmin")];

/**
 * GET  /leaderboard          → public leaderboard (optional auth)
 * GET  /leaderboard/me       → my rank (auth required)
 * POST /admin/leaderboard/recompute  → force recompute (superadmin)
 */
leaderboardRouter.get("/leaderboard", optionalAuth, getLeaderboard);
leaderboardRouter.get("/leaderboard/me", verifyAuth, getMyRank);
leaderboardRouter.post(
  "/admin/leaderboard/recompute",
  superAdminGuard,
  adminRecompute
);

export default leaderboardRouter;
