import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { teamService } from "./team.service";
import {
  createTeamSchema,
  inviteUserSchema,
  joinTeamByCodeSchema,
  searchTeamSchema,
  updateTeamSchema,
} from "./team.validate";

const createTeam = asyncHandler(async (req, res) => {
  const data = parseBody(createTeamSchema, req.body);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const team = await teamService.createTeam({
    ...data,
    ownerId: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, team, "Team created successfully"));
});

const getTeam = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  // Include invites only if the requester is in this team

  const isRequestMember = req.user?.teamId?.toString() === id;

  const team = await teamService.getTeamById(id, isRequestMember);

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Team retrieved successfully"));
});

const getMyTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getMyTeam(req.user!._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        team,
        team ? "Your team retrieved" : "You are not in a team"
      )
    );
});

const updateTeam = asyncHandler(async (req, res) => {
  const teamId = req.params.id as string;

  if (!teamId) {
    throw new ApiError(400, "Team id is required");
  }

  const data = parseBody(updateTeamSchema, req.body);

  const team = await teamService.updateTeam({
    ...data,
    teamId,
    requesterId: req.user!._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Team updated successfully"));
});

const generateJoinCode = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Team id is required");
  }

  const code = await teamService.generateJoinCode(id, req.user!._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { joinCode: code },
        "Join code generated successfully"
      )
    );
});

const joinTeamByCode = asyncHandler(async (req, res) => {
  const data = parseBody(joinTeamByCodeSchema, req.body);

  const team = await teamService.joinTeamByCode(req.user!._id, data.code);

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Team joined successfully"));
});

const inviteUser = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Team id is required");
  }

  const data = parseBody(inviteUserSchema, req.body);

  await teamService.inviteUser(id, req.user!._id, data.username);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, `Invitation sent to ${data.username}`));
});

const acceptInvite = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Team id is required");
  }

  const team = await teamService.acceptInviteService(req.user!._id, id);

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Invite accepted. Welcome to the team!"));
});

const declineInvite = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Team id is required");
  }

  await teamService.declineInvite(req.user!._id, id);

  return res.status(200).json(new ApiResponse(200, {}, "Invite declined"));
});

const leaveTeam = asyncHandler(async (req, res) => {
  await teamService.leaveTeam(req.user!._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "You have left the team"));
});

const kickMember = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  const userId = req.params.userId as string;

  if (!id) {
    throw new ApiError(400, "Member id is required");
  }

  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  await teamService.kickMember(id, req.user!._id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed from team"));
});

const searchTeams = asyncHandler(async (req, res) => {
  const raw = Object.keys(req.query).length ? req.query : req.body;
  const data = parseBody(searchTeamSchema, raw);

  const result = await teamService.searchTeams(data);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Teams fetched successfully"));
});

// Admin

const adminDisbandTeam = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Team id is required");
  }

  await teamService.adminDisbandTeam(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Team disbanded successfully"));
});

export {
  createTeam,
  getTeam,
  getMyTeam,
  updateTeam,
  generateJoinCode,
  joinTeamByCode,
  inviteUser,
  acceptInvite,
  declineInvite,
  leaveTeam,
  kickMember,
  searchTeams,
  adminDisbandTeam,
};
