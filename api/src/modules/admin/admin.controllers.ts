// Dashboard

import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { adminService } from "./admin.service";
import { UserRole } from "./admin.types";
import {
  adminListFilterSchema,
  adminUpdateUserSchema,
  adminUserFiltersSchema,
  auditLogFiltersSchema,
  banUserSchema,
  changeRoleSchema,
  createAdminSchema,
  manualScoreAdjustSchema,
} from "./admin.validators";

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats retrieved"));
});

// User Management

const getUsers = asyncHandler(async (req, res) => {
  const parsed = adminUserFiltersSchema.safeParse(req.query);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.message);
  }

  const data = parsed.data;

  const result = await adminService.getUsers(data);

  if (!result) {
    throw new ApiError(500, "Something went wrong while getting users");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users: result.users, meta: result.meta },
        "Users retrieved"
      )
    );
});

const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const user = await adminService.getUserById(userId);

  if (!user) {
    throw new ApiError(500, "Something went wrong while getting user");
  }

  return res.status(200).json(new ApiResponse(200, user, "User retrieved"));
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const data = parseBody(adminUpdateUserSchema, req.body);

  const user = await adminService.updateUser({
    ...data,
    userId: userId,
    requesterId: req.user!._id,
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while updating user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

const banUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const data = parseBody(banUserSchema, req.body);

  const user = await adminService.banUser(
    { ...data, userId: userId },
    req.user!._id,
    req.user!.username
  );

  if (!user) {
    throw new ApiError(500, "Something went wrong while banning user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User banned successfully"));
});

const unbanUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const user = await adminService.unbanUser(
    userId,
    req.user!._id,
    req.user!.username
  );

  if (!user) {
    throw new ApiError(500, "Something went wrong while unbanning user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User unbanned successfully"));
});

const changeRole = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const data = parseBody(changeRoleSchema, req.body);

  const role = data.role;

  const user = await adminService.changeRole(
    userId,
    role,
    req.user!._id,
    req.user!.role as UserRole,
    req.user!.username
  );

  if (!user) {
    throw new ApiError(500, "Something went wrong while changing role");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Role updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  await adminService.deleteUser(userId, req.user!._id, req.user!.username);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User account deleted and PII anonymised"));
});

// Score Management

const manualScoreAdjust = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const data = parseBody(manualScoreAdjustSchema, req.body);

  const result = await adminService.manualScoreAdjust({
    ...data,
    userId: userId,
    requesterId: req.user!._id,
  });

  if (!result) {
    throw new ApiError(500, "Something went wrong while adjusting score");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Score adjusted successfully"));
});

const recalculateAllScores = asyncHandler(async (req, res) => {
  const result = await adminService.recalculateAllScores(
    req.user!._id,
    req.user!.username
  );

  if (!result) {
    throw new ApiError(500, "Something went wrong while recalculating scores");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Scores recalculated — ${result.usersUpdated} users, ${result.teamsUpdated} teams updated in ${result.durationMs}ms`
      )
    );
});

// Admin Account Management

const getAdmins = asyncHandler(async (req, res) => {
  const data = parseBody(adminListFilterSchema, req.query);

  const result = await adminService.getAdmins(data);

  if (!result) {
    throw new ApiError(500, "Something went wrong while fetching admins");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { admins: result.admins, meta: result.meta },
        "Admin accounts retrieved"
      )
    );
});

const createAdmin = asyncHandler(async (req, res) => {
  const data = parseBody(createAdminSchema, req.body);

  const admin = await adminService.createAdmin({
    ...data,
    requesterId: req.user!._id,
    requesterRole: req.user!.role,
    requesterUsername: req.user!.username,
  });

  if (!admin) {
    throw new ApiError(500, "Something went wrong while creating admin");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        admin,
        `${admin.role === "superadmin" ? "Superadmin" : "Admin"} account created successfully`
      )
    );
});

const revokeAdmin = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "Missing userId");
  }

  const success = await adminService.revokeAdmin(
    userId,
    req.user!._id,
    req.user!.username
  );

  if (!success) {
    throw new ApiError(500, "Something went wrong while revoking admin");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Admin privileges revoked. Account is now a regular user."
      )
    );
});

// Audit Logs

const getAuditLogs = asyncHandler(async (req, res) => {
  const data = parseBody(auditLogFiltersSchema, req.body);

  const result = await adminService.getAuditLogs(data);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { logs: result.logs, meta: result.meta },
        "Audit logs retrieved"
      )
    );
});

const getAuditLogById = asyncHandler(async (req, res) => {
  const logId = req.params.logId as string;

  if (!logId) {
    throw new ApiError(400, "Missing logId");
  }

  const log = await adminService.getAuditLogById(logId);

  if (!log) {
    throw new ApiError(500, "Something went wrong while fetching audit log");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, log, "Audit log entry retrieved"));
});

export {
  // Dashboard
  getDashboardStats,
  // Users
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  changeRole,
  deleteUser,
  // Scores
  manualScoreAdjust,
  recalculateAllScores,
  // Admin accounts
  getAdmins,
  createAdmin,
  revokeAdmin,
  // Audit
  getAuditLogs,
  getAuditLogById,
};
