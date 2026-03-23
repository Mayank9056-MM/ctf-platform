import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import {
  AdminListFilters,
  AdminUpdateUserPayload,
  AdminUserFilters,
  AuditLogFilters,
  BanUserPayload,
  CreateAdminPayload,
  ManualScoreAdjustPayload,
  PaginationMeta,
  PlatformStats,
  RecalculateScoresResult,
  UserRole,
} from "./admin.types";
import User, { IUser } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import logger from "../../utils/logger";
import Submission from "../../models/submission.model";
import Story from "../../models/story.model";
import UserStoryProgress from "../../models/userProgressStory.model";
import Team from "../../models/team.model";
import Challenge from "../../models/challenge.model";

// Internal Helpers

function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

function daysBefore(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const audit = async (
  entry: Parameters<IAuditLogModel["record"]>[0]
): Promise<void> => {
  try {
    await (AuditLog as unknown as IAuditLogModel).record(entry);
  } catch (err) {
    // Audit log failure must never crash the operation
    logger.error("[AdminService] Failed to write audit log", err);
  }
};

// Service

class AdminService {
  /**
   * Retrieves aggregated statistics for the entire platform.
   * @returns An object containing various statistics, including user, team, challenge, submission, and story statistics.
   */
  async getDashboardStats(): Promise<PlatformStats> {
    const today = startOfToday();

    const [
      totalUsers,
      verifiedUsers,
      bannedUsers,
      deletedUsers,
      newLast7,
      newLast30,
      activeLastDay,
      activeLastWeek,
      totalTeams,
      activeTeams,
      teamSizeAgg,
      challengeStats,
      submissionToday,
      totalSubmissions,
      firstBloods,
      storyStats,
      storyPlayers,
      topSolvers,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, isVerified: true }),
      User.countDocuments({ isDeleted: false, isBanned: true }),
      User.countDocuments({ isDeleted: true }),
      User.countDocuments({
        isDeleted: false,
        createdAt: { $gte: daysBefore(7) },
      }),
      User.countDocuments({
        isDeleted: false,
        createdAt: { $gte: daysBefore(30) },
      }),
      User.countDocuments({
        isDeleted: false,
        lastActive: { $gte: daysBefore(1) },
      }),
      User.countDocuments({
        isDeleted: false,
        lastActive: { $gte: daysBefore(7) },
      }),
      Team.countDocuments(),
      Team.countDocuments({ isActive: true }),
      Team.aggregate([
        { $match: { isActive: true } },
        { $project: { memberCount: { $size: "$members" } } },
        { $group: { _id: null, avg: { $avg: "$memberCount" } } },
      ]),
      Challenge.aggregate([
        { $match: { isActive: true } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  visible: { $sum: { $cond: ["$isVisible", 1, 0] } },
                  totalSolves: { $sum: "$solveCount" },
                  totalAttempts: { $sum: "$totalAttempts" },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: "$category",
                  count: { $sum: 1 },
                  solves: { $sum: "$solveCount" },
                },
              },
              { $sort: { count: -1 } },
            ],
            byDifficulty: [
              {
                $group: {
                  _id: "$difficulty",
                  count: { $sum: 1 },
                  solves: { $sum: "$solveCount" },
                },
              },
            ],
          },
        },
      ]),
      Submission.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: "$isCorrect",
            count: { $sum: 1 },
          },
        },
      ]),
      Submission.countDocuments(),
      Submission.countDocuments({ isFirstBlood: true }),
      Story.aggregate([
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  published: {
                    $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                  },
                  totalCompletions: { $sum: "$completionCount" },
                },
              },
            ],
          },
        },
      ]),
      UserStoryProgress.countDocuments(),
      User.find({ isDeleted: false, isBanned: false })
        .select("_id username avatar score solvedChallenges country")
        .sort({ score: -1 })
        .limit(10)
        .lean(),
      (AuditLog as unknown as IAuditLogModel)
        .find({})
        .select("action summary outcome createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const cStats = challengeStats[0];
    const cTotals = cStats?.totals?.[0] ?? {
      total: 0,
      visible: 0,
      totalSolves: 0,
      totalAttempts: 0,
    };

    const correctToday =
      submissionToday.find((s: { _id: boolean }) => s._id === true)?.count ?? 0;
    const incorrectToday =
      submissionToday.find((s: { _id: boolean }) => s._id === false)?.count ??
      0;

    const storyCounts = storyStats[0]?.counts?.[0] ?? {
      total: 0,
      published: 0,
      totalCompletions: 0,
    };

    const solveRate =
      cTotals.totalAttempts > 0
        ? Math.round(
            (cTotals.totalSolves / cTotals.totalAttempts) * 100 * 100
          ) / 100
        : 0;

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        banned: bannedUsers,
        deleted: deletedUsers,
        newLast7Days: newLast7,
        newLast30Days: newLast30,
        activeLastDay,
        activeLastWeek,
      },
      teams: {
        total: totalTeams,
        active: activeTeams,
        averageSize: Math.round((teamSizeAgg[0]?.avg ?? 0) * 10) / 10,
      },
      challenges: {
        total: cTotals.total,
        visible: cTotals.visible,
        totalSolves: cTotals.totalSolves,
        totalAttempts: cTotals.totalAttempts,
        solveRate,
        byCategory: cStats?.byCategory ?? [],
        byDifficulty: cStats?.byDifficulty ?? [],
      },
      submissions: {
        totalToday: correctToday + incorrectToday,
        correctToday,
        incorrectToday,
        firstBloods,
        totalAllTime: totalSubmissions,
      },
      stories: {
        total: storyCounts.total,
        published: storyCounts.published,
        totalPlayersStat: storyPlayers,
        totalCompletions: storyCounts.totalCompletions,
      },
      topSolvers: topSolvers.map((u) => ({
        _id: u._id.toString(),
        username: u.username,
        avatar: u.avatar,
        score: u.score,
        solvedCount: u.solvedChallenges?.length ?? 0,
        country: u.country,
      })),
      recentAuditLogs: recentAuditLogs.map((l) => ({
        _id: l._id.toString(),
        action: l.action,
        summary: l.summary,
        outcome: l.outcome,
        createdAt: l.createdAt,
      })),
    };
  }

  // User Management

  /**
   * Retrieves a list of users with optional filtration and pagination.
   * @param {AdminUserFilters} filters - The filters to apply to the query.
   * @returns {Promise<{ users: IUser[]; meta: IMeta }>} - A promise which resolves to an object containing the list of users and metadata.
   * @throws {ApiError} 404 - If no users are found.
   */
  async getUsers(filters: AdminUserFilters) {
    const {
      page,
      limit,
      search,
      role,
      isBanned,
      isVerified,
      isDeleted,
      hasTeam,
      country,
      sortBy,
      sortOrder,
    } = filters;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned;
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (isDeleted !== undefined) query.isDeleted = isDeleted;
    else query.isDeleted = false; // default: exclude deleted
    if (country) query.country = country;

    if (hasTeam === true) query.teamId = { $ne: null };
    if (hasTeam === false) query.teamId = null;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      score: { score: sortOrder === "asc" ? 1 : -1 },
      createdAt: { createdAt: sortOrder === "asc" ? 1 : -1 },
      lastActive: { lastActive: sortOrder === "asc" ? 1 : -1 },
      username: { username: sortOrder === "asc" ? 1 : -1 },
      email: { email: sortOrder === "asc" ? 1 : -1 },
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "username email fullName avatar role score isBanned isVerified isDeleted country createdAt lastActive teamId solvedChallenges providers mobileNumber"
        )
        .populate("teamId", "name avatar score")
        .sort(sortMap[sortBy] ?? { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return { users, meta: buildMeta(page, limit, total) };
  }

  /**
   * Retrieves a user by its ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<{ IUser & { submissionCount: number, correctSolves: number }>>} - A promise which resolves to an object containing the user and the number of submissions and correct solves the user has made.
   * @throws {ApiError} - If the user is not found.
   */
  async getUserById(userId: string) {
    const user = await User.findById(userId)
      .select(
        "-password -refreshToken -resetPasswordToken -emailVerificationToken -resetPasswordExpire -emailVerificationExpire"
      )
      .populate("teamId", "name avatar score isActive")
      .lean();

    if (!user) throw new ApiError(404, "User not found");

    const [submissionCount, correctSolves] = await Promise.all([
      Submission.countDocuments({ user: userId }),
      Submission.countDocuments({ user: userId, isCorrect: true }),
    ]);

    return {
      ...user,
      submissionCount,
      correctSolves,
    };
  }

  /**
   * Updates a user's profile information.
   * @param {AdminUpdateUserPayload} payload - Object containing the user ID, requester ID, and fields to be updated.
   * @returns {Promise<IUser>} - A promise which resolves to the updated user object.
   * @throws {ApiError} - If the user is not found, if the username or email is already taken, or if there is an error while updating the user.
   */
  async updateUser(payload: AdminUpdateUserPayload) {
    const { userId, requesterId, ...updates } = payload;

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new ApiError(404, "User not found");

    // Uniqueness checks before touching the document
    if (updates.username && updates.username !== user.username) {
      const taken = await User.findOne({
        username: { $regex: new RegExp(`^${updates.username}$`, "i") },
        _id: { $ne: userId },
      }).lean();
      if (taken) throw new ApiError(409, "Username already taken");
    }

    if (updates.email && updates.email !== user.email) {
      const taken = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      }).lean();
      if (taken) throw new ApiError(409, "Email already in use");
      // Email change resets verification
      user.isVerified = false;
    }

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const changedFields: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      const current = (user as unknown as Record<string, unknown>)[key];
      if (JSON.stringify(current) !== JSON.stringify(value)) {
        before[key] = current;
        after[key] = value;
        changedFields.push(key);
        (user as unknown as Record<string, unknown>)[key] = value;
      }
    }

    await user.save({ validateBeforeSave: false });

    if (changedFields.length > 0) {
      await audit({
        action: "user:update_profile",
        outcome: "success",
        actor: {
          userId: requesterId,
          username: null,
          role: "admin",
          type: "admin",
        },
        target: {
          id: user._id as Types.ObjectId,
          collection: "User",
          label: user.username,
        },
        diff: { before, after, changedFields },
      });
    }

    return user;
  }

  /**
   * Bans a user from the application.
   * Only admins can ban users.
   * @param payload - The payload containing the user ID to ban, the reason for the ban and the optional expiry date.
   * @param requesterId - The ID of the admin who is banning the user.
   * @param requesterUsername - The username of the admin who is banning the user.
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 409 - User is already banned
   * @returns A promise that resolves when the user is banned.
   */
  async banUser(
    payload: BanUserPayload,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ) {
    const { userId, reason, expiresAt } = payload;

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new ApiError(404, "User not found");
    if (user.isBanned) throw new ApiError(409, "User is already banned");

    user.isBanned = true;
    await user.save({ validateBeforeSave: false });

    await audit({
      action: "user:ban",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: user._id as Types.ObjectId,
        collection: "User",
        label: user.username,
      },
      metadata: { reason, expiresAt: expiresAt ?? "permanent" },
    });

    return user;
  }

  /**
   * Unbans a user from the application.
   * Only admins can unban users.
   * @param {string} userId - The ID of the user to unban.
   * @param {Types.ObjectId} requesterId - The ID of the admin who is unbanning the user.
   * @param {string} requesterUsername - The username of the admin who is unbanning the user.
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 409 - User is not currently banned
   * @returns A promise that resolves when the user is unbanned.
   */
  async unbanUser(
    userId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ) {
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new ApiError(404, "User not found");
    if (!user.isBanned) throw new ApiError(409, "User is not currently banned");

    user.isBanned = false;
    await user.save({ validateBeforeSave: false });

    await audit({
      action: "user:unban",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: user._id as Types.ObjectId,
        collection: "User",
        label: user.username,
      },
    });

    return user;
  }

  /**
   * Changes the role of a user.
   * Only admins can change the role of users.
   * @throws {ApiError} 401 - You cannot change your own role
   * @throws {ApiError} 401 - Only superadmins can grant the superadmin role
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 409 - Cannot demote the last superadmin. Promote another user first.
   * @returns A promise that resolves when the user's role is changed.
   */
  async changeRole(
    userId: string,
    role: UserRole,
    requesterId: Types.ObjectId,
    requesterRole: UserRole,
    requesterUsername: string
  ) {
    if (userId === requesterId.toString()) {
      throw new ApiError(401, "You cannot change your own role");
    }

    if (role === "superadmin" && requesterRole !== "superadmin") {
      throw new ApiError(401, "Only superadmins can grant the superadmin role");
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new ApiError(404, "User not found");

    if (user.role === "superadmin" && role !== "superadmin") {
      const count = await User.countDocuments({
        role: "superadmin",
        isDeleted: false,
      });
      if (count <= 1) {
        throw new ApiError(
          409,
          "Cannot demote the last superadmin. Promote another user first."
        );
      }
    }

    const previousRole = user.role;
    user.role = role;
    await user.save({ validateBeforeSave: false });

    await audit({
      action: "user:role_change",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: requesterRole,
        type: "admin",
      },
      target: {
        id: user._id as Types.ObjectId,
        collection: "User",
        label: user.username,
      },
      diff: {
        before: { role: previousRole },
        after: { role },
        changedFields: ["role"],
      },
    });

    return user;
  }

  /**
   * Deletes a user account.
   * Throws 401 if the requesting user is attempting to delete their own account.
   * Throws 404 if the user is not found.
   * @param {string} userId - The id of the user to delete.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @param {string} requesterUsername - The username of the user performing the action.
   */
  async deleteUser(
    userId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ) {
    if (userId === requesterId.toString()) {
      throw new ApiError(
        401,
        "You cannot delete your own account via the admin panel"
      );
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new ApiError(404, "User not found");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove from team
      if (user.teamId) {
        await Team.updateOne(
          { _id: user.teamId },
          { $pull: { members: user._id } },
          { session }
        );
      }

      // Anonymise PII
      const suffix = crypto.randomBytes(6).toString("hex");
      user.email = `deleted_${suffix}@deleted.invalid`;
      user.username = `deleted_${user._id.toString().slice(-8)}`;
      user.fullName = undefined;
      user.mobileNumber = undefined;
      user.bio = undefined;
      user.avatar = undefined;
      user.teamId = undefined;
      user.isDeleted = true;
      user.isBanned = true;
      user.providers = [] as unknown as typeof user.providers;

      await user.save({ session, validateBeforeSave: false });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await audit({
      action: "user:delete",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "superadmin",
        type: "admin",
      },
      target: {
        id: new Types.ObjectId(userId),
        collection: "User",
        label: userId,
      },
    });
  }

  // Score Management

  /**
   * Manually adjusts a user's score.
   * Throws 404 if the user is not found.
   * @param {ManualScoreAdjustPayload} payload - The payload containing the user ID, delta, reason and requester ID.
   * @returns {Promise<{userId: string, previousScore: number, newScore: number, delta: number}>} - The promise of the user ID, previous score, new score and delta.
   */
  async manualScoreAdjust(payload: ManualScoreAdjustPayload) {
    const { userId, delta, reason, requesterId } = payload;

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new ApiError(404, "User not found");

    const previousScore = user.score;
    user.score = Math.max(0, user.score + delta);
    await user.save({ validateBeforeSave: false });

    if (user.teamId) {
      const newTeamScore = Math.max(
        0,
        (await Team.findById(user.teamId).select("score").lean())?.score ??
          0 + delta
      );
      await Team.findByIdAndUpdate(user.teamId, {
        $set: { score: newTeamScore },
      });
    }

    await audit({
      action: "user:score_update",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: null,
        role: "admin",
        type: "admin",
      },
      target: {
        id: user._id as Types.ObjectId,
        collection: "User",
        label: user.username,
      },
      diff: {
        before: { score: previousScore },
        after: { score: user.score },
        changedFields: ["score"],
      },
      metadata: { delta, reason },
    });

    return { userId, previousScore, newScore: user.score, delta };
  }

  /**
   * Recalculates the scores for all users and teams by re-aggregating correct solves.
   * This function is expensive and should only be called when absolutely necessary.
   *
   * @param requesterId - The ID of the user who initiated the recalculation.
   * @param requesterUsername - The username of the user who initiated the recalculation.
   *
   * @returns An object containing information about the recalculation, including the number of users and teams updated, and the duration of the operation in milliseconds.
   */
  async recalculateAllScores(
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<RecalculateScoresResult> {
    const start = Date.now();

    const userScores: {
      _id: Types.ObjectId;
      totalScore: number;
      solvedIds: Types.ObjectId[];
    }[] = await Submission.aggregate([
      { $match: { isCorrect: true } },
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$pointsAwarded" },
          solvedIds: { $addToSet: "$challenge" },
        },
      },
    ]);

    if (userScores.length > 0) {
      await User.bulkWrite(
        userScores.map(({ _id, totalScore, solvedIds }) => ({
          updateOne: {
            filter: { _id },
            update: {
              $set: { score: totalScore, solvedChallenges: solvedIds },
            },
          },
        }))
      );
    }

    // Zero out users with no correct solves
    await User.updateMany(
      { _id: { $nin: userScores.map((u) => u._id) }, isDeleted: false },
      { $set: { score: 0, solvedChallenges: [] } }
    );

    const teamScores: {
      _id: Types.ObjectId;
      totalScore: number;
      solvedIds: Types.ObjectId[];
    }[] = await Submission.aggregate([
      { $match: { isCorrect: true, team: { $ne: null } } },
      {
        $group: {
          _id: "$team",
          totalScore: { $sum: "$pointsAwarded" },
          solvedIds: { $addToSet: "$challenge" },
        },
      },
    ]);

    if (teamScores.length > 0) {
      await Team.bulkWrite(
        teamScores.map(({ _id, totalScore, solvedIds }) => ({
          updateOne: {
            filter: { _id },
            update: {
              $set: { score: totalScore, solvedChallenges: solvedIds },
            },
          },
        }))
      );
    }

    await Team.updateMany(
      { _id: { $nin: teamScores.map((t) => t._id) } },
      { $set: { score: 0, solvedChallenges: [] } }
    );

    const durationMs = Date.now() - start;

    await audit({
      action: "admin:bulk_reset_scores",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "superadmin",
        type: "admin",
      },
      target: { collection: "User" },
      metadata: {
        usersUpdated: userScores.length,
        teamsUpdated: teamScores.length,
        durationMs,
      },
    });

    return {
      usersUpdated: userScores.length,
      teamsUpdated: teamScores.length,
      durationMs,
    };
  }

  // Admin Account Management

  /**
   * Retrieves a list of admin accounts.
   * @param {AdminListFilters} filters - Filters to apply to the query.
   * @returns A promise which resolves to an object containing the list of admin accounts and metadata about the query.
   */
  async getAdmins(filters: AdminListFilters) {
    const { page, limit, role, search } = filters;

    const query: Record<string, unknown> = {
      role: role ?? { $in: ["admin", "superadmin"] },
      isDeleted: false,
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const [admins, total] = await Promise.all([
      User.find(query)
        .select(
          "username email fullName role isVerified isBanned createdAt lastActive avatar"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return { admins, meta: buildMeta(page, limit, total) };
  }

  /**
   * Creates a new admin account.
   * @param {CreateAdminPayload} payload - Object containing the details of the admin account to be created.
   * @returns A promise which resolves to the newly created admin account.
   * @throws {ApiError} If the email address is already taken, or if the username is already taken, or if the requester is not a superadmin and is trying to create a superadmin account.
   */
  async createAdmin(payload: CreateAdminPayload) {
    const {
      email,
      password,
      fullName,
      role,
      requesterId,
      requesterRole,
      requesterUsername,
    } = payload;

    if (role === "superadmin" && requesterRole !== "superadmin") {
      throw new ApiError(
        401,
        "Only superadmins can create superadmin accounts"
      );
    }

    const emailTaken = await User.findOne({ email }).lean();
    if (emailTaken) {
      throw new ApiError(
        409,
        `An account with email "${email}" already exists`
      );
    }

    const admin = await User.create({
      email,
      password,
      fullName:
        fullName?.trim() ??
        `${role === "superadmin" ? "Superadmin" : "Admin"} Account`,
      role,
      isVerified: true,
      isBanned: false,
      isDeleted: false,
      providers: [{ provider: "local", providerId: email }],
    });

    await audit({
      action: "user:role_change",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: requesterRole,
        type: "admin",
      },
      target: {
        id: admin._id as Types.ObjectId,
        collection: "User",
        label: admin.username,
      },
      diff: {
        before: { role: "none" },
        after: { role },
        changedFields: ["role"],
      },
      metadata: { action: "admin_account_created", createdRole: role },
    });

    // Strip password from returned document
    const adminObj = admin.toObject() as IUser;
    delete adminObj.password;

    return adminObj;
  }

  /**
   * Revokes admin privileges from a user.
   *
   * @param {string} userId - The ID of the user to revoke admin privileges from.
   * @param {Types.ObjectId} requesterId - The ID of the user who initiated the revocation.
   * @param {string} requesterUsername - The username of the user who initiated the revocation.
   *
   * @throws {ApiError} If the user is attempting to revoke their own admin privileges.
   * @throws {ApiError} If the target user is not found.
   * @throws {ApiError} If the target user is the last superadmin.
   *
   * @returns {Promise<boolean>} A promise which resolves to true if the revocation is successful.
   */
  async revokeAdmin(
    userId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<boolean> {
    if (userId === requesterId.toString()) {
      throw new ApiError(400, "You cannot revoke your own admin privileges");
    }

    const target = await User.findOne({
      _id: userId,
      role: { $in: ["admin", "superadmin"] },
      isDeleted: false,
    });

    if (!target) throw new ApiError(404, "Admin account not found");

    if (target.role === "superadmin") {
      const count = await User.countDocuments({
        role: "superadmin",
        isDeleted: false,
      });
      if (count <= 1) {
        throw new ApiError(
          409,
          "Cannot revoke the last superadmin. Promote another user first."
        );
      }
    }

    const previousRole = target.role;
    target.role = "user";
    await target.save({ validateBeforeSave: false });

    await audit({
      action: "user:role_change",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "superadmin",
        type: "admin",
      },
      target: {
        id: target._id as Types.ObjectId,
        collection: "User",
        label: target.username,
      },
      diff: {
        before: { role: previousRole },
        after: { role: "user" },
        changedFields: ["role"],
      },
      metadata: { action: "admin_revoked" },
    });

    return true;
  }

  // Audit Logs

  /**
   * Retrieves a list of audit logs matching the given filters.
   *
   * @param filters - An object containing filters for the audit logs.
   * @property {number} filters.page - The page number to retrieve.
   * @property {number} filters.limit - The number of audit logs to retrieve per page.
   * @property {string} filters.action - The action to filter by (case-insensitive).
   * @property {string} filters.outcome - The outcome to filter by (case-insensitive).
   * @property {ObjectId} filters.actorId - The ID of the actor to filter by.
   * @property {ObjectId} filters.targetId - The ID of the target to filter by.
   * @property {string} filters.collection - The collection of the target to filter by.
   * @property {string} filters.ipAddress - The IP address of the request to filter by.
   * @property {Date} filters.from - The earliest date to filter by.
   * @property {Date} filters.to - The latest date to filter by.
   *
   * @returns An object containing a list of audit logs and metadata.
   * @property {IAuditLog[]} response.logs - The list of audit logs matching the filters.
   * @property {Meta} response.meta - Metadata about the response.
   */
  async getAuditLogs(filters: AuditLogFilters) {
    const {
      page,
      limit,
      action,
      outcome,
      actorId,
      targetId,
      collection,
      ipAddress,
      from,
      to,
    } = filters;

    const query: Record<string, unknown> = {};

    if (action) query.action = { $regex: action, $options: "i" };
    if (outcome) query.outcome = outcome;
    if (actorId) query["actor.userId"] = new Types.ObjectId(actorId);
    if (targetId) query["target.id"] = new Types.ObjectId(targetId);
    if (collection) query["target.collection"] = collection;
    if (ipAddress) query["request.ipAddress"] = ipAddress;

    if (from || to) {
      query.createdAt = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    const [logs, total] = await Promise.all([
      (AuditLog as unknown as IAuditLogModel)
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      (AuditLog as unknown as IAuditLogModel).countDocuments(query),
    ]);

    return { logs, meta: buildMeta(page, limit, total) };
  }

  /**
   * Retrieves an audit log by its ID.
   *
   * @param {string} logId - The ID of the audit log to retrieve.
   *
   * @returns {Promise<IAuditLog>} A promise that resolves to the audit log matching the provided ID.
   * @throws {ApiError} If the audit log is not found.
   */
  async getAuditLogById(logId: string) {
    const log = await (AuditLog as unknown as IAuditLogModel)
      .findById(logId)
      .lean();
    if (!log) throw new ApiError(404, "Audit log entry not found");
    return log;
  }
}

export const adminService = new AdminService();
