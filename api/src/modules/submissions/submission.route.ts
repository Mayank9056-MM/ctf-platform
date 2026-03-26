import express from "express";
import {
  requiredVerified,
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminDeleteSubmission,
  adminGetStats,
  adminGetSubmissionById,
  adminGetSubmissions,
  adminGetUserSubmissions,
  getChallengeHistory,
  getChallengeSolves,
  getMyStats,
  getMySubmissions,
  submitFlag,
} from "./submission.controller";

const submissionRouter = express.Router();

const adminGuard = [verifyAuth, requireRole("admin", "superadmin")];
const superAdminGuard = [verifyAuth, requireRole("superadmin")];

/**
 * POST /challenges/:challengeId/submit
 *   → Submit a flag. Verified accounts only.
 *   → Rate limited at service layer (5 wrong / min per user per challenge).
 *   → 200 = correct, 400 = incorrect.
 */
submissionRouter.post(
  "/challenges/:challengeId/submit",
  verifyAuth,
  requiredVerified,
  submitFlag
);

/**
 * GET /submissions/me              → own submission history
 * GET /submissions/me/stats        → own submission stats
 */
submissionRouter.get("/submissions/me", verifyAuth, getMySubmissions);
submissionRouter.get("/submissions/me/stats", verifyAuth, getMyStats);

/**
 * GET /challenges/:challengeId/history  → own attempts for one challenge
 * GET /challenges/:challengeId/solves   → public solve leaderboard
 */
submissionRouter.get(
  "/challenges/:challengeId/history",
  verifyAuth,
  getChallengeHistory
);
submissionRouter.get("/challenges/:challengeId/solves", getChallengeSolves);

// Admin

/**
 * GET    /admin/submissions               → paginated submission log
 * GET    /admin/submissions/stats         → aggregate analytics stats
 * GET    /admin/submissions/:id           → single submission detail
 * DELETE /admin/submissions/:id           → delete + reverse points (superadmin)
 * GET    /admin/users/:userId/submissions → all submissions for a user
 */
submissionRouter.get("/admin/submissions", adminGuard, adminGetSubmissions);
submissionRouter.get("/admin/submissions/stats", adminGuard, adminGetStats);
submissionRouter.get(
  "/admin/submissions/:submissionId",
  adminGuard,
  adminGetSubmissionById
);
submissionRouter.delete(
  "/admin/submissions/:submissionId",
  superAdminGuard,
  adminDeleteSubmission
);
submissionRouter.get(
  "/admin/users/:userId/submissions",
  adminGuard,
  adminGetUserSubmissions
);

export default submissionRouter;
