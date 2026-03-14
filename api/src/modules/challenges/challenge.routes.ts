import express from "express";
import {
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminAddHint,
  adminCreateChallenge,
  adminDeleteChallenge,
  adminGetChallenges,
  adminGetStats,
  adminGetSubmissions,
  adminPublishChallenge,
  adminRemoveAttachment,
  adminRemoveHint,
  adminUnpublishChallenge,
  adminUpdateChallenge,
  getChallengeDetail,
  getChallenges,
  getChallengeSolves,
  purchaseHint,
  submitFlag,
} from "./challenge.controller";

const challengeRouter = express.Router();

// Admin routes

const adminGuard = [verifyAuth, requireRole("admin", "superadmin")];

/**
 * GET    /challenges/admin              -> list all challenges
 * POST   /challenges/admin              -> create challenge
 * GET    /challenges/admin/stats        -> challenge stats
 */
challengeRouter.route("/admin").get(adminGuard, adminGetChallenges);
challengeRouter.route("/admin").post(adminGuard, adminCreateChallenge);
challengeRouter.route("/admin/stats").get(adminGuard, adminGetStats);

// PATCH   /challenges/admin/:id             -> update challenge
// DELETE  /challenges/admin/:id             -> delete challenge
// PATCH   /challenges/admin/:id/publish     -> publish challenge
// PATCH   /challenges/admin/:id/unpublish   -> unpublish challenge

// POST    /challenges/admin/:id/hints              -> add hint
// DELETE  /challenges/admin/:id/hints/:hintIndex   -> remove hint

// POST    /challenges/admin/:id/attachments              -> add attachment
//DELETE  /challenges/admin/:id/attachments/:attachmentId -> remove attachment

//GET     /challenges/admin/:id/submissions         -> get challenge submissions

challengeRouter.route("/admin/:id").patch(adminGuard, adminUpdateChallenge);
challengeRouter.route("/admin/:id").delete(adminGuard, adminDeleteChallenge);
challengeRouter
  .route("/admin/:id/publish")
  .patch(adminGuard, adminPublishChallenge);
challengeRouter.patch(
  "/admin/:id/unpublish",
  adminGuard,
  adminUnpublishChallenge
);

challengeRouter.route("/admin/:id/hints").post(adminGuard, adminAddHint);
challengeRouter
  .route("/admin/:id/hints/:hintIndex")
  .delete(adminGuard, adminRemoveHint);

challengeRouter
  .route("/admin/:id/attachments/:attachmentId")
  .delete(adminGuard, adminRemoveAttachment);

challengeRouter
  .route("/admin/:id/submissions")
  .get(adminGuard, adminGetSubmissions);

// Player routes

// GET    /challenges -> list all challenges
challengeRouter.route("/").get(verifyAuth, getChallenges);

// GET /challenges/:id -> get challenge detail
challengeRouter.route("/:idOrSlug").get(verifyAuth, getChallengeDetail);

// POST /challenges/:id/submit -> submit flag
challengeRouter.route("/:id/submit").post(verifyAuth, submitFlag);

// POST /challenges/:id/hints -> purchase hint
challengeRouter.route("/:id/hints").post(verifyAuth, purchaseHint);

// GET /challenges/:id/solves -> get challenge solves
challengeRouter.route("/:id/solves").get(getChallengeSolves);

export default challengeRouter;
