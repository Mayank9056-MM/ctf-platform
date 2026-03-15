import { Types } from "mongoose";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import User from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { createAdminInput, getAdminsInput } from "./admin.types";
import Team from "../../models/team.model";
import Challenge from "../../models/challenge.model";
import Submission from "../../models/submission.model";

class AdminService {
  // helpers

  /**
   * Builds a meta object for pagination.
   * @param page The current page number.
   * @param limit The number of items per page.
   * @param total The total number of items.
   * @returns An object containing the page, limit, total number of items, total number of pages, and flags indicating if there are next or previous pages.
   */
  private buildMeta(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Returns a Date object representing the start of the current day (00:00:00 of the current date).
   * @returns {Date} A Date object representing the start of the current day.
   */
  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Returns a Date object that represents the given number of days before the current date and time.
   * @param {number} days - The number of days to subtract from the current date and time.
   * @returns {Date} A Date object representing the given number of days before the current date and time.
   */
  private daysBefore(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  // main

  /**
   * Retrieves aggregated statistics for admin ops.
   * @returns A promise which resolves to an object containing statistics by category, total number of challenges, visible challenges, and total solves.
   */
  async getDashboardStats() {
    const today = this.startOfToday();

    const [
      totalUsers,
      verifiedUsers,
      bannedUsers,
      newLast7,
      newLast30,
      activeLastDay,
      totalTeams,
      activeTeams,
      challengeStats,
      todaySubmissions,
      firstBloods,
      topSolvers,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, isVerified: true }),
      User.countDocuments({ isDeleted: false, isBanned: true }),
      User.countDocuments({
        isDeleted: false,
        createdAt: { $gte: this.daysBefore(7) },
      }),
      User.countDocuments({
        isDeleted: false,
        createAt: { $gte: this.daysBefore(30) },
      }),
      User.countDocuments({
        isDeleted: false,
        lastActive: {
          $gte: this.daysBefore(1),
        },
      }),
      Team.countDocuments(),
      Team.countDocuments({ isActive: true }),
      Challenge.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
            visible: {
              $sum: {
                $cond: ["$isVisible", 1, 0],
              },
            },
            totalSolves: {
              $sum: "$solveCount",
            },
            totalAttempts: {
              $sum: "$totalAttempts",
            },
          },
        },
      ]),
      Submission.aggregate([
        {
          $match: {
            createAt: {
              $gte: today,
            },
          },
        },
        {
          $group: {
            _id: "$isCorrect",
            count: {
              $sum: 1,
            },
          },
        },
      ]),
      Submission.countDocuments({ isFirstBlood: true }),
      User.find({ isDeleted: false, isBanned: false })
        .select("_id username score solvedChallenges")
        .sort({ score: -1 })
        .limit(10)
        .lean()
        .then((users) =>
          users.map((u) => ({
            _id: u._id.toString(),
            username: u.username,
            score: u.score,
            solvedCount: u.solvedChallenges?.length ?? 0,
          }))
        ),
      (AuditLog as unknown as IAuditLogModel)
        .find({})
        .select("action summary outcome createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .then((logs) =>
          logs.map((l) => ({
            _id: l._id.toString(),
            action: l.action,
            summary: l.summary,
            outcome: l.outcome,
            createdAt: l.createdAt,
          }))
        ),
    ]);

    const cStats = challengeStats[0] ?? {
      total: 0,
      visible: 0,
      totalSolves: 0,
      totalAttempts: 0,
    };

    const correctToday =
      todaySubmissions.find((s: { _id: boolean }) => s._id === true)?.count ??
      0;

    const incorrectToday =
      todaySubmissions.find((s: { _id: boolean }) => s._id === false)?.count ??
      0;

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        banned: bannedUsers,
        newLast7Days: newLast7,
        newLast30Days: newLast30,
        activeLastDay,
      },
      teams: {
        total: totalTeams,
        active: activeTeams,
      },
      challenges: {
        total: cStats.total,
        visible: cStats.visible,
        totalSolves: cStats.totalSolves,
        totalAttempts: cStats.totalAttempts,
      },
      submissions: {
        totalToday: correctToday + incorrectToday,
        correctToday,
        incorrectToday,
        firstBloods,
      },
      topSolvers,
      recentActivity,
    };
  }

  /**
   * Retrieves a list of administrators for admin ops.
   * @param {getAdminsInput} data - The input data containing the search query, page number, and limit.
   * @returns A promise which resolves to an object containing the list of administrators, total number of administrators, page number, limit, and metadata.
   * @throws {ApiError} 404 - If no administrators are found.
   */
  async getAdmins(data: getAdminsInput) {
    const { role, search, page = 1, limit = 20 } = data;

    const query: Record<string, unknown> = {
      role: role ?? { $in: ["admin", "superadmin"] },
      isDeleted: false,
    };

    if (search) {
      query.$or = [
        { username: { $regex: data.search, $options: "i" } },
        { email: { $regex: data.search, $options: "i" } },
        { fullName: { $regex: data.search, $options: "i" } },
      ];
    }

    const [admins, total] = await Promise.all([
      User.find(query)
        .select(
          "username email fullName role isVerified isBanned createdAt lastActive"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    const result = {
      admins,
      meta: this.buildMeta(page, limit, total),
    };

    return result;
  }

  /**
   * Creates a new admin user.
   * @param {createAdminInput} data - The input data containing the email, password, full name, role, requester id, requester role, and requester username.
   * @returns A promise which resolves to the newly created admin user.
   * @throws {ApiError} 403 - If the requester is not a superadmin and is trying to create a superadmin account.
   * @throws {ApiError} 409 - If an account with the same email already exists.
   */
  async createAdmin(data: createAdminInput) {
    const {
      email,
      password,
      fullName,
      role,
      requesterId,
      requesterRole,
      requesterUsername,
    } = data;

    // role gaurd
    if (role === "superadmin" && requesterRole !== "superadmin") {
      throw new ApiError(403, "Only superadmin can create superadmin accounts");
    }

    // email uniqueness
    const emailTaken = await User.findOne({ email });

    if (emailTaken) {
      throw new ApiError(409, `An account with email ${email} already exists`);
    }

    const admin = await User.create({
      email,
      password,
      fullName,
      role,
      isVerified: true,
      providers: [
        {
          provider: "local",
          providerId: email,
        },
      ],
    });

    await (AuditLog as unknown as IAuditLogModel).record({
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
      metadata: {
        action: "admin_account_created",
        createdRole: role,
      },
    });

    return admin;
  }

  /**
   * Revoke admin privileges of a user.
   * @param {string} userId - The id of the user to revoke admin privileges from.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @param {string} requesterUsername - The username of the user performing the action.
   * @throws {ApiError} 400 - If the user is attempting to revoke their own admin privileges.
   * @throws {ApiError} 404 - If the admin account is not found.
   * @throws {ApiError} 409 - If the user is attempting to revoke the last superadmin.
   * @returns {Promise<boolean>} - A promise which resolves to true when the admin privileges have been revoked successfully.
   */
  async revokeAdmin(
    userId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ) {
    if (userId === requesterId.toString()) {
      throw new ApiError(400, "You cannot revoke you own admin privileges");
    }

    const target = await User.findOne({
      _id: userId,
      role: {
        $in: ["admin", "superadmin"],
      },
      isDeleted: false,
    });

    if (!target) {
      throw new ApiError(404, "Admin account not found");
    }

    // prevent removing the last superadmin
    if (target.role === "superadmin") {
      const count = await User.countDocuments({
        role: "superadmin",
        isDeleted: false,
      });

      if (count <= 1) {
        throw new ApiError(
          409,
          "Cannot revoke the last superadmin. Promote another user first"
        );
      }
    }

    const previousRole = target.role;
    target.role = "user";

    await target.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "user:role_change",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "user",
        type: "admin",
      },
      target: {
        id: target._id as Types.ObjectId,
        collection: "User",
        label: target.username,
      },
      diff: {
        before: {
          role: previousRole,
        },
        after: {
          role: "user",
        },
        changedFields: ["role"],
      },
      metadata: {
        action: "admin_revoked",
      },
    });

    return true;
  }
}

export const adminService = new AdminService();
