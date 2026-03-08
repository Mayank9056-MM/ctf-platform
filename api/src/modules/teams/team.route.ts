import express from "express";
import {
  acceptInvite,
  adminDisbandTeam,
  createTeam,
  declineInvite,
  generateJoinCode,
  getMyTeam,
  getTeam,
  inviteUser,
  joinTeamByCode,
  kickMember,
  leaveTeam,
  updateTeam,
} from "./team.controller";
import {
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";

const teamRouter = express.Router();

// PUBLIC ROUTES

// GET /teams/:id (public team profile)
teamRouter.route("/get-team/:id").get(getTeam);

// PRIVATE ROUTES

// POST /teams (create team)
// GET /teams/my (get my team)
// PATCH /teams/:id (update team settings - owner only)
// POST /teams/join (join team by join code)
// POST /teams/leave (leave team)
teamRouter.route("/").post(verifyAuth, createTeam);
teamRouter.route("/my").get(verifyAuth, getMyTeam);
teamRouter.route("/:id").patch(verifyAuth, updateTeam);
teamRouter.route("/join").post(verifyAuth, joinTeamByCode);
teamRouter.route("/leave").post(verifyAuth, leaveTeam);

// POST /teams/:id/join-code (generate/refresh join code - owner only)
// POST /teams/:id/invite (invite user to team - owner only)
// POST /team/:id/accept-invite (accept invite to team - user only)
// POST /team/:id/decline-invite (decline invite to team - user only)
// DELETE /teams/:id/members/:userId (kick user from team - owner only)
teamRouter.route("/:id/join-code").post(verifyAuth, generateJoinCode);
teamRouter.route("/:id/invite").post(verifyAuth, inviteUser);
teamRouter.route("/:id/accept-invite").post(verifyAuth, acceptInvite);
teamRouter.route("/:id/decline-invite").post(verifyAuth, declineInvite);
teamRouter.route("/:id/members/:userId").delete(verifyAuth, kickMember);

// admin routes

// DELETE /teams/:id/disband (disband team - admin only)
teamRouter
  .route("/:id/disband")
  .delete(verifyAuth, requireRole("admin", "superadmin"), adminDisbandTeam);

export default teamRouter;
