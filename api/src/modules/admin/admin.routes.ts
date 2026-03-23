import express from "express";
import {
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  banUser,
  changeRole,
  createAdmin,
  deleteUser,
  getAdmins,
  getAuditLogById,
  getAuditLogs,
  getDashboardStats,
  getUserById,
  getUsers,
  manualScoreAdjust,
  recalculateAllScores,
  revokeAdmin,
  unbanUser,
  updateUser,
} from "./admin.controllers";

const adminRouter = express.Router();

// Guards

/** Any privileged user */
const isAdmin = [verifyAuth, requireRole("admin", "superadmin")];

/** Restricted operations — superadmin only */
const isSuperAdmin = [verifyAuth, requireRole("superadmin")];

// Dashboard

// GET /admin/dashboard
adminRouter.get("/dashboard", isAdmin, getDashboardStats);

// User Management

/**
 * GET    /admin/users
 *   Query: search, role, isBanned, isVerified, isDeleted, hasTeam, country,
 *          sortBy, sortOrder, page, limit
 *
 * GET    /admin/users/:userId
 *   Full user detail including submission counts.
 *
 * PATCH  /admin/users/:userId
 *   Update user fields: fullName, username, email, score, country, isVerified, bio
 *   Note: Changing `score` should only be done by superadmin — enforce at
 *         the application layer by checking req.user.role if you want this.
 *
 * POST   /admin/users/:userId/ban
 *   Body: { reason: string, expiresAt?: ISO string }
 *
 * POST   /admin/users/:userId/unban
 *
 * PATCH  /admin/users/:userId/role
 *   Body: { role: "user" | "admin" | "superadmin" }
 *   Superadmin only — granting "superadmin" requires superadmin role.
 *
 * DELETE /admin/users/:userId
 *   Superadmin only. Soft-delete + PII anonymisation.
 */
adminRouter.get("/users", isAdmin, getUsers);
adminRouter.get("/users/:userId", isAdmin, getUserById);
adminRouter.patch("/users/:userId", isAdmin, updateUser);
adminRouter.post("/users/:userId/ban", isAdmin, banUser);
adminRouter.post("/users/:userId/unban", isAdmin, unbanUser);
adminRouter.patch("/users/:userId/role", isSuperAdmin, changeRole);
adminRouter.delete("/users/:userId", isSuperAdmin, deleteUser);

// Score Management

/**
 * POST  /admin/users/:userId/score/adjust
 *   Body: { delta: number (non-zero), reason: string }
 *   Adds or subtracts points. Floor is 0 (never goes negative).
 *   Syncs team score automatically.
 *
 * POST  /admin/scores/recalculate
 *   Superadmin only. Full recalculation from Submission history.
 *   Expensive — use sparingly (e.g. after deleting a challenge or fixing points).
 */
adminRouter.post("/users/:userId/score/adjust", isAdmin, manualScoreAdjust);
adminRouter.post("/scores/recalculate", isSuperAdmin, recalculateAllScores);

// Admin Account Management

/**
 * GET    /admin/admins
 *   Superadmin only. List all admin/superadmin accounts.
 *   Query: role, search, page, limit
 *
 * POST   /admin/admins
 *   Superadmin only. Create a new admin account.
 *   Body: { email, password, fullName?, username?, role: "admin"|"superadmin" }
 *   Admin accounts are pre-verified (skip email verification flow).
 *
 * DELETE /admin/admins/:userId
 *   Superadmin only. Revoke admin privileges (demotes to "user").
 *   Cannot revoke the last superadmin.
 */
adminRouter.get("/admins", isSuperAdmin, getAdmins);
adminRouter.post("/admins", isSuperAdmin, createAdmin);
adminRouter.delete("/admins/:userId", isSuperAdmin, revokeAdmin);

// Audit Logs

/**
 * GET  /admin/audit-logs
 *   Superadmin only. Paginated, filtered audit log.
 *   Query: action, outcome, actorId, targetId, collection, ipAddress, from, to, page, limit
 *
 * GET  /admin/audit-logs/:logId
 *   Superadmin only. Full audit log entry detail (includes diff + metadata).
 */
adminRouter.get("/audit-logs", isSuperAdmin, getAuditLogs);
adminRouter.get("/audit-logs/:logId", isSuperAdmin, getAuditLogById);

export default adminRouter;
