import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import {
  FLAG_SHARE_ALERT_THRESHOLD,
  MAX_FLAG_ATTEMPTS_PER_WINDOW,
  RATE_LIMIT_WINDOW_MS,
} from "../../utils/constants";
import logger from "../../utils/logger";
import {
  AdminSubmissionFilters,
  ChallengeSubmissionHistoryFilters,
  MySubmissionFilters,
  SubmissionStats,
  SubmitFlagPayload,
  SubmitFlagResult,
  UserSubmissionStats,
} from "./submission.type";
import Submission, {
  ISubmission,
  ISubmissionModel,
} from "../../models/submission.model";
import { ApiError } from "../../utils/ApiError";
import Challenge from "../../models/challenge.model";
import User from "../../models/user.model";
import Team from "../../models/team.model";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import { storyService } from "../story/story.service";
import { leaderboardService } from "../leaderboard/leaderboard.service";
import { rateLimitCache } from "../../lib/redis";
import { socketEmit } from "../../socket/socket.emitters";

type solveWithRank = ISubmission & { rank: number };

/**
 * Hashes a flag string using sha256.
 * If caseSensitive is true, the flag is trimmed but not lowercased.
 * If caseSensitive is false, the flag is trimmed and lowercased.
 * @param flag - The flag string to hash.
 * @param caseSensitive - Whether to hash the flag in a case-sensitive manner.
 * @returns The hashed flag string.
 */
function hashFlag(flag: string, caseSensitive: boolean): string {
  const normalized = caseSensitive ? flag.trim() : flag.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Extracts the IP address from a forwarded-for header or a remote address.
 * If the forwarded-for header is present, it returns the first IP address in the list.
 * If the forwarded-for header is not present, it returns the remote address.
 * If neither the forwarded-for header nor the remote address are present, it returns "unknown".
 * @param forwardedFor - The forwarded-for header from the request.
 * @param remoteAddress - The remote address from the request.
 * @returns The extracted IP address.
 */
export function extractIp(
  forwardedFor: string | undefined,
  remoteAddress: string | undefined
): string {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  return remoteAddress ?? "unknown";
}

/** In-memory flag share tracker (swap for Redis in production). */
const _flagShareMap = new Map<string, Set<string>>();

/**
 * Tracks flag sharing between users by storing the IPs that submit the same correct flag.
 * Logs a warning if the number of unique IPs submitting the same flag exceeds the threshold.
 * @param challengeId - The id of the challenge being tracked.
 * @param flagHash - The correct flag hash being tracked.
 * @param ip - The IP address of the user submitting the flag.
 */
function trackFlagShare(
  challengeId: string,
  flagHash: string,
  ip: string
): void {
  const key = `${challengeId}:${flagHash}`;
  const ips = _flagShareMap.get(key) ?? new Set<string>();
  ips.add(ip);
  _flagShareMap.set(key, ips);

  if (ips.size >= FLAG_SHARE_ALERT_THRESHOLD) {
    logger.warn(
      `[ANTI-CHEAT] Possible flag sharing on challenge ${challengeId}: ` +
        `${ips.size} unique IPs submitted the same correct flag`
    );
  }
}

/**
 * Returns a Date object representing a date `n` days before the current date.
 * @param {number} n - The number of days before the current date.
 * @returns {Date} A Date object representing a date `n` days before the current date.
 */
function daysBefore(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Returns midnight UTC of a given date string "YYYY-MM-DD" */
function toUtcMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Returns today's date as "YYYY-MM-DD" in UTC */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns yesterday's date as "YYYY-MM-DD" in UTC */
function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

class SubmissionService {
  /**
   * Submits a flag for a challenge.
   * @param {SubmitFlagPayload} payload - An object containing the user ID, team ID (optional), challenge ID, flag, IP address and user agent (optional).
   * @returns {Promise<SubmitFlagResult>} - A promise which resolves to an object containing the result of the submission, points awarded, first blood status, and a message.
   * @throws {ApiError} 404 - If the challenge is not found.
   * @throws {ApiError} 429 - If the user has attempted to submit more than MAX_FLAG_ATTEMPTS_PER_WINDOW flags in the last minute.
   * @throws {ApiError} 400 - If the challenge has closed.
   * @throws {ApiError} 409 - If the user or team has already solved the challenge.
   */
  async submitFlag(payload: SubmitFlagPayload): Promise<SubmitFlagResult> {
    const { userId, teamId, challengeId, flag, ip, userAgent } = payload;

    const count = await rateLimitCache.count(userId.toString(), challengeId);

    if (count >= MAX_FLAG_ATTEMPTS_PER_WINDOW) {
      throw new ApiError(429, "Too many incorrect attempts");
    }

    const challenge = await Challenge.findOne({
      _id: challengeId,
      isVisible: true,
      isActive: true,
    }).select("+flag");

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    // Closed check
    if (challenge.closedAt && challenge.closedAt < new Date()) {
      throw new ApiError(
        400,
        "This challenge has closed and is no longer accepting submissions"
      );
    }

    // Duplicate solve check (user)
    const userAlreadySolved = await Submission.exists({
      user: userId,
      challenge: challengeId,
      isCorrect: true,
    });

    if (userAlreadySolved) {
      throw new ApiError(
        409,
        "You have already solved this challenge. Each challenge can only be solved once."
      );
    }

    // Duplicate solve check (team)
    if (teamId) {
      const teamAlreadySolved = await Submission.exists({
        team: teamId,
        challenge: challengeId,
        isCorrect: true,
      });

      if (teamAlreadySolved) {
        throw new ApiError(409, "Your team has already solved this challenge.");
      }
    }

    // Verify flag
    const submittedHash = hashFlag(flag, challenge.isCaseSensitive);
    const isCorrect = submittedHash === challenge.flag;

    // Snapshot points BEFORE solveCount increments (critical for dynamic scoring)
    const pointsAwarded = isCorrect ? challenge.getCurrentPoints() : 0;
    const isFirstBlood =
      isCorrect && (!challenge.firstBlood || !challenge.firstBlood.user);

    // Persist submission
    const submission = new Submission({
      user: userId,
      challenge: challengeId,
      team: teamId ?? null,
      isCorrect,
      pointsAwarded,
      isFirstBlood,
      flagHash: submittedHash,
      meta: { ipAddress: ip, userAgent: userAgent ?? null },
    });

    (submission as unknown as { _rawFlag: string })._rawFlag = flag;
    await submission.save();

    // Increment attempts on challenge
    challenge.totalAttempts = (challenge.totalAttempts ?? 0) + 1;

    if (!isCorrect) {
      await challenge.save({ validateBeforeSave: false });

      const attempts = await rateLimitCache.increment(
        userId.toString(),
        challengeId
      );

      return {
        isCorrect: false,
        pointsAwarded: 0,
        isFirstBlood: false,
        attemptsInWindow: attempts,
        message: `Incorrect flag. Try again. (${attempts}/${MAX_FLAG_ATTEMPTS_PER_WINDOW} attempts this minute)`,
      };
    }
    const [updatedUser] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { solvedChallenges: challengeId },
          $inc: { score: pointsAwarded },
        },
        { new: true }
      ).select("score"),

      challenge.recordSolve(userId, teamId),

      teamId &&
        Team.findByIdAndUpdate(teamId, {
          $addToSet: { solvedChallenges: challengeId },
          $inc: { score: pointsAwarded },
        }),
    ]);

    leaderboardService
      .markStale("global_user")
      .catch((err) =>
        logger.warn("[SubmissionService] Leaderboard mark stale failed", err)
      );

    if (teamId) {
      leaderboardService
        .markStale("global_team")
        .catch((err) =>
          logger.warn("[SubmissionService] Leaderboard mark stale failed", err)
        );
    }

    socketEmit.correctSolve(userId.toString(), {
      challengeId,
      challengeTitle: challenge.title,
      pointsAwarded,
      newScore: updatedUser?.score ?? 0,
      rank: 0,
    });

    if (isFirstBlood) {
      socketEmit.firstBlood({
        challengeId,
        challengeTitle: challenge.title,
        userId: userId.toString(),
        username: "...", // fetch from user doc
        teamId: teamId?.toString(),
        teamName: "...",
        pointsAwarded,
      });
    }

    if (teamId) {
      socketEmit.teamChallengeSolved({
        teamId: teamId.toString(),
        challengeId,
        challengeTitle: challenge.title,
        solverUsername: "...",
        pointsAwarded,
      });
    }

    // Anti-cheat tracking
    trackFlagShare(challengeId, submittedHash, ip);

    // Audit log
    await (AuditLog as unknown as IAuditLogModel)
      .record({
        action: isFirstBlood ? "submission:first_blood" : "submission:correct",
        outcome: "success",
        actor: {
          userId,
          username: null,
          role: "user",
          type: "user",
        },
        target: {
          id: challenge._id as Types.ObjectId,
          collection: "Challenge",
          label: challenge.title,
        },
        request: { ipAddress: ip, userAgent },
        metadata: {
          pointsAwarded,
          isFirstBlood,
          solveCount: challenge.solveCount,
          submissionId: submission._id.toString(),
        },
      })
      .catch((err) =>
        logger.error("[SubmissionService] Audit log write failed", err)
      );

    const totalAttempts = await Submission.countDocuments({
      user: userId,
      challenge: challengeId,
    });

    await rateLimitCache.reset(userId.toString(), challengeId);

    // Story hook (fire-and-forget)
    storyService
      .notifyChallengeSolved(challengeId, userId, pointsAwarded, totalAttempts)
      .catch((err) =>
        logger.warn(
          `[SubmissionService] Story hook failed for challenge ${challengeId}: ${err?.message}`
        )
      );

    return {
      isCorrect: true,
      pointsAwarded,
      isFirstBlood,
      newScore: updatedUser?.score,
      message: isFirstBlood
        ? `🩸 First blood! +${pointsAwarded} points`
        : `Correct flag! +${pointsAwarded} points`,
    };
  }

  // Player: My Submissions

  /**
   * Retrieves a list of submissions for a user, filtered by optional criteria.
   * @param {Types.ObjectId} userId - The user to fetch submissions for.
   * @param {MySubmissionFilters} filters - Optional filtration criteria.
   * @property {number} page - The page number to fetch.
   * @property {number} limit - The number of submissions to fetch per page.
   * @property {boolean} [isCorrect] - Optional filtration by correct/incorrect submissions.
   * @property {string} [challengeId] - Optional filtration by challenge ID.
   * @property {"asc" | "desc"} [sortOrder] - Optional sorting order.
   * @returns {Promise<{
   *   submissions: ISubmission[],
   *   total: number,
   *   page: number,
   *   limit: number
   * }>} - A promise which resolves to an object containing the list of submissions, total number of submissions, page number and limit.
   */
  async getMySubmissions(
    userId: Types.ObjectId,
    filters: MySubmissionFilters
  ): Promise<{
    submissions: ISubmission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, isCorrect, challengeId, sortOrder } = filters;

    const query: Record<string, unknown> = { user: userId };
    if (isCorrect !== undefined) query.isCorrect = isCorrect;
    if (challengeId) query.challenge = new Types.ObjectId(challengeId);

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate("challenge", "title slug category difficulty points")
        .populate("team", "name avatar")
        .select("-flagHash")
        .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments(query),
    ]);

    return { submissions, total, page, limit };
  }

  /**
   * Retrieves a list of submissions for a user in a specific challenge, filtered by optional criteria.
   * @param {Types.ObjectId} userId - The user to fetch submissions for.
   * @param {string} challengeId - The challenge to fetch submissions for.
   * @param {ChallengeSubmissionHistoryFilters} filters - Optional filtration criteria.
   * @property {number} page - The page number to fetch.
   * @property {number} limit - The number of submissions to fetch per page.
   * @returns {Promise<{
   *   submissions: ISubmission[],
   *   total: number,
   *   page: number,
   *   limit: number
   * }>} - A promise which resolves to an object containing the list of submissions, total number of submissions, page number and limit.
   */
  async getChallengeSubmissionHistory(
    userId: Types.ObjectId,
    challengeId: string,
    filters: ChallengeSubmissionHistoryFilters
  ): Promise<{
    submissions: ISubmission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit } = filters;

    const challengeExists = await Challenge.exists({
      _id: challengeId,
      isVisible: true,
      isActive: true,
    });

    if (!challengeExists) throw new ApiError(404, "Challenge not found");

    const [submissions, total] = await Promise.all([
      Submission.find({
        user: userId,
        challenge: challengeId,
      })
        .select(
          "isCorrect pointsAwarded isFirstBlood meta.solveTimeSeconds createdAt"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Submission.countDocuments({
        user: userId,
        challenge: challengeId,
      }),
    ]);

    return { submissions, total, page, limit };
  }

  /**
   * Retrieves a user's submission statistics.
   * @param {Types.ObjectId} userId - The ID of the user to retrieve submission stats for.
   * @returns {Promise<UserSubmissionStats>} - A promise which resolves to an object containing the user's submission stats.
   */
  async getMyStats(userId: Types.ObjectId): Promise<UserSubmissionStats> {
    // Run all independent queries in parallel
    const [totals, recentActivity, rankResult, solvedDays] = await Promise.all([
      // 1. Submission totals
      Submission.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            firstBloods: { $sum: { $cond: ["$isFirstBlood", 1, 0] } },
            totalPoints: { $sum: "$pointsAwarded" },
          },
        },
      ]),

      // 2. Daily activity (last 30 days) — all submissions
      Submission.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: daysBefore(30) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),

      (async () => {
        const user = await User.findById(userId).select("score").lean();
        if (!user) return 1;

        const usersAbove = await User.countDocuments({
          score: { $gt: user.score },
          isDeleted: false,
          isBanned: false,
        });

        return usersAbove + 1; // rank 1-based
      })(),

      Submission.aggregate([
        {
          $match: {
            user: userId,
            isCorrect: true,
            createdAt: { $gte: daysBefore(365) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
        { $sort: { _id: -1 } }, // newest first
        { $project: { date: "$_id", _id: 0 } },
      ]),
    ]);

    let streak = 0;

    if (solvedDays.length > 0) {
      const solvedSet = new Set<string>(
        (solvedDays as { date: string }[]).map((d) => d.date)
      );

      const today = todayUtc();
      const yesterday = yesterdayUtc();

      // Streak must include today or yesterday to be "active"
      const startDay = solvedSet.has(today)
        ? today
        : solvedSet.has(yesterday)
          ? yesterday
          : null;

      if (startDay) {
        // Walk backwards day by day from startDay
        const current = new Date(`${startDay}T00:00:00.000Z`);
        while (true) {
          const dateStr = current.toISOString().slice(0, 10);
          if (!solvedSet.has(dateStr)) break;
          streak++;
          current.setUTCDate(current.getUTCDate() - 1);
        }
      }
    }

    // Average attempts per correct solve
    const attemptStats = await Submission.aggregate([
      { $match: { user: userId, isCorrect: true } },
      {
        $lookup: {
          from: "submissions",
          let: { challengeId: "$challenge", userId: "$user" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$challenge", "$$challengeId"] },
                    { $eq: ["$user", "$$userId"] },
                    { $eq: ["$isCorrect", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "wrongAttempts",
        },
      },
      {
        $project: {
          totalAttempts: {
            $add: [
              1,
              { $ifNull: [{ $arrayElemAt: ["$wrongAttempts.count", 0] }, 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgAttempts: { $avg: "$totalAttempts" },
        },
      },
    ]);

    // Assemble result
    const t = totals[0] ?? {
      total: 0,
      correct: 0,
      firstBloods: 0,
      totalPoints: 0,
    };

    const incorrect = t.total - t.correct;
    const solveRate =
      t.total > 0 ? Math.round((t.correct / t.total) * 100 * 100) / 100 : 0;
    const avgAttempts =
      Math.round((attemptStats[0]?.avgAttempts ?? 1) * 10) / 10;

    return {
      total: t.total,
      correct: t.correct,
      incorrect,
      firstBloods: t.firstBloods,
      totalPointsEarned: t.totalPoints,
      averageAttemptsPerSolve: avgAttempts,
      solveRate,
      recentActivity: recentActivity as { date: string; count: number }[],
      rank: rankResult,
      streak,
      challengesSolved: t.correct,
    };
  }

  /**
   * Retrieves a list of correct solves for a challenge, sorted oldest-first.
   * Optional pagination: page and limit.
   * @param {string} challengeId - The challenge to fetch solves for.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of solves to fetch per page.
   * @returns {Promise<{
   *   solves: ISubmission[],
   *   total: number,
   *   page: number,
   *   limit: number
   * }>} - A promise which resolves to an object containing the list of solves, total number of solves, page number and limit.
   * @throws {ApiError} 404 - If no challenge is found.
   */
  async getChallengeSolves(challengeId: string, page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const exists = await Challenge.exists({
      _id: challengeId,
      isVisible: true,
      isActive: true,
    });

    if (!exists) {
      throw new ApiError(404, "Challenge not found");
    }

    const [solves, total] = await Promise.all([
      Submission.find({ challenge: challengeId, isCorrect: true })
        .populate("user", "username avatar country")
        .populate("team", "name avatar")
        .select(
          "user team pointsAwarded isFirstBlood createdAt meta.solveTimeSeconds"
        )
        .sort({ createdAt: 1 }) // oldest = highest rank
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments({ challenge: challengeId, isCorrect: true }),
    ]);

    return {
      solves: solves.map((s, i) => ({
        ...s,
        rank: (page - 1) * limit + i + 1,
      })),
      total,
      page,
      limit,
    };
  }

  // Admin

  /**
   * Retrieves a list of submissions for a challenge, filtered by optional criteria.
   * @param {AdminSubmissionFilters} filters - Optional filtration criteria.
   * @property {number} page - The page number to fetch.
   * @property {number} limit - The number of submissions to fetch per page.
   * @property {boolean} [isCorrect] - Optional filtration by correct/incorrect submissions.
   * @property {boolean} [isFirstBlood] - Optional filtration by first-blood submissions.
   * @property {string} [userId] - Optional filtration by user ID.
   * @property {string} [teamId] - Optional filtration by team ID.
   * @property {string} [challengeId] - Optional filtration by challenge ID.
   * @property {string} [ipAddress] - Optional filtration by IP address.
   * @property {Date} [from] - Optional filtration by submission creation time (inclusive).
   * @property {Date} [to] - Optional filtration by submission creation time (exclusive).
   * @property {"createdAt" | "pointsAwarded" | "meta.solveTimeSeconds"} sortBy - Optional sorting order.
   * @property {"asc" | "desc"} sortOrder - Optional sorting direction.
   * @returns {Promise<{
   *   submissions: ISubmission[],
   *   total: number,
   *   page: number,
   *   limit: number
   * }>} - A promise which resolves to an object containing the list of submissions, total number of submissions, page number and limit.
   */
  async getAdminSubmissions(filters: AdminSubmissionFilters): Promise<{
    submissions: ISubmission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page,
      limit,
      isCorrect,
      isFirstBlood,
      userId,
      teamId,
      challengeId,
      ipAddress,
      from,
      to,
      sortBy,
      sortOrder,
    } = filters;

    const query: Record<string, unknown> = {};

    if (isCorrect !== undefined) query.isCorrect = isCorrect;
    if (isFirstBlood !== undefined) query.isFirstBlood = isFirstBlood;
    if (userId) query.user = new Types.ObjectId(userId);
    if (teamId) query.team = new Types.ObjectId(teamId);
    if (challengeId) query.challenge = new Types.ObjectId(challengeId);
    if (ipAddress) query["meta.ipAddress"] = ipAddress;

    if (from || to) {
      query.createdAt = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate("user", "username email avatar country")
        .populate("team", "name avatar")
        .populate("challenge", "title slug category difficulty points")
        .select("-flagHash")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments(query),
    ]);

    return { submissions, total, page, limit };
  }

  /**
   * Retrieves various statistics for admins.
   * @param {string} [challengeId] - Optional challenge ID to filter statistics by.
   * @param {Date} [from] - Optional start date for filtering submissions.
   * @param {Date} [to] - Optional end date for filtering submissions.
   * @returns {Promise<SubmissionStats>} - A promise which resolves to an object containing the statistics.
   */
  async getAdminStats(
    challengeId?: string,
    from?: Date,
    to?: Date
  ): Promise<SubmissionStats> {
    const matchBase: Record<string, unknown> = {};
    if (challengeId) matchBase.challenge = new Types.ObjectId(challengeId);
    if (from || to) {
      matchBase.createdAt = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    const [
      totals,
      topSolvers,
      activityByDay,
      byCategory,
      uniqueSolvers,
      uniqueChallenges,
    ] = await Promise.all([
      // Totals + first bloods
      Submission.aggregate([
        { $match: matchBase },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            firstBloods: { $sum: { $cond: ["$isFirstBlood", 1, 0] } },
          },
        },
      ]),

      // Top solvers by correct submission count
      Submission.aggregate([
        { $match: { ...matchBase, isCorrect: true } },
        {
          $group: {
            _id: "$user",
            correctCount: { $sum: 1 },
            totalPoints: { $sum: "$pointsAwarded" },
          },
        },
        { $sort: { correctCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            userId: "$_id",
            username: "$user.username",
            avatar: "$user.avatar",
            correctCount: 1,
            totalPoints: 1,
          },
        },
      ]),

      Submission.aggregate([
        {
          $match: {
            ...matchBase,
            createdAt: { $gte: from ?? daysBefore(30) },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              isCorrect: "$isCorrect",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            correct: {
              $sum: {
                $cond: [{ $eq: ["$_id.isCorrect", true] }, "$count", 0],
              },
            },
            incorrect: {
              $sum: {
                $cond: [{ $eq: ["$_id.isCorrect", false] }, "$count", 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", correct: 1, incorrect: 1, _id: 0 } },
      ]),

      // Submissions by challenge category
      Submission.aggregate([
        { $match: matchBase },
        {
          $lookup: {
            from: "challenges",
            localField: "challenge",
            foreignField: "_id",
            as: "challengeDoc",
          },
        },
        { $unwind: "$challengeDoc" },
        {
          $group: {
            _id: "$challengeDoc.category",
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            category: "$_id",
            correct: 1,
            incorrect: { $subtract: ["$total", "$correct"] },
            solveRate: {
              $round: [
                { $multiply: [{ $divide: ["$correct", "$total"] }, 100] },
                2,
              ],
            },
            _id: 0,
          },
        },
        { $sort: { correct: -1 } },
      ]),

      // Unique solvers count
      Submission.distinct("user", { ...matchBase, isCorrect: true }).then(
        (ids) => ids.length
      ),

      // Unique challenges solved count
      Submission.distinct("challenge", { ...matchBase, isCorrect: true }).then(
        (ids) => ids.length
      ),
    ]);

    const t = totals[0] ?? { total: 0, correct: 0, firstBloods: 0 };
    const incorrect = t.total - t.correct;
    const solveRate =
      t.total > 0 ? Math.round((t.correct / t.total) * 100 * 100) / 100 : 0;

    return {
      total: t.total,
      correct: t.correct,
      incorrect,
      firstBloods: t.firstBloods,
      solveRate,
      uniqueSolvers,
      uniqueChallenges,
      topSolvers: topSolvers.map((s) => ({
        userId: s.userId.toString(),
        username: s.username,
        avatar: s.avatar,
        correctCount: s.correctCount,
        totalPoints: s.totalPoints,
      })),
      activityByDay,
      byCategory,
    };
  }

  /**
   * Retrieve a submission by ID.
   * @param {string} submissionId - The submission ID to retrieve.
   * @returns {Promise<IAdminSubmission>} - A promise which resolves to the submission document.
   * @throws {ApiError} 404 - Submission not found.
   */
  async getAdminSubmissionById(submissionId: string) {
    const submission = await Submission.findById(submissionId)
      .populate("user", "username email avatar country role")
      .populate("team", "name avatar score")
      .populate(
        "challenge",
        "title slug category difficulty points scoringType"
      )
      .select("-flagHash")
      .lean();

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    return submission;
  }

  /**
   * Deletes a submission by its ID.
   * If the submission is correct, it reverses the score impact on the user and team.
   * If the submission is first blood, it also resets the first blood on the challenge.
   * @param {string} submissionId - The ID of the submission to delete.
   * @param {ObjectId} requesterId - The ID of the user requesting the deletion.
   * @param {string} requesterUsername - The username of the user requesting the deletion.
   * @throws {ApiError} 404 - Submission not found.
   * @returns {Promise<void>} - A promise which resolves when the submission is deleted.
   */
  async deleteSubmission(
    submissionId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<void> {
    const submission = await Submission.findById(submissionId)
      .select("-flagHash")
      .lean();

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    if (!submission.isCorrect) {
      // Incorrect submissions can be deleted without score impact
      await Submission.findByIdAndDelete(submissionId);
      return;
    }

    // Correct submission — reverse the score and remove challenge from solved list
    const pointsToReverse = submission.pointsAwarded;

    await Promise.all([
      Submission.findByIdAndDelete(submissionId),

      User.findByIdAndUpdate(submission.user, {
        $inc: { score: -pointsToReverse },
        $pull: { solvedChallenges: submission.challenge },
      }),

      submission.team &&
        Team.findByIdAndUpdate(submission.team, {
          $inc: { score: -pointsToReverse },
          $pull: { solvedChallenges: submission.challenge },
        }),

      // Decrement challenge solveCount + update firstBlood if it was first blood
      submission.isFirstBlood
        ? Challenge.findByIdAndUpdate(submission.challenge, {
            $inc: { solveCount: -1, totalAttempts: -1 },
            $unset: { firstBlood: "" },
          })
        : Challenge.findByIdAndUpdate(submission.challenge, {
            $inc: { solveCount: -1, totalAttempts: -1 },
          }),
    ]);

    leaderboardService
      .markStale("global_user")
      .catch((err) =>
        logger.warn("[SubmissionService] Leaderboard mark stale failed", err)
      );

    if (submission.team) {
      leaderboardService
        .markStale("global_team")
        .catch((err) =>
          logger.warn("[SubmissionService] Leaderboard mark stale failed", err)
        );
    }

    // Clamp user score to 0 in case of floating point / race
    await User.updateOne(
      { _id: submission.user, score: { $lt: 0 } },
      { $set: { score: 0 } }
    );

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "submission:attempt",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "superadmin",
        type: "admin",
      },
      target: {
        id: new Types.ObjectId(submissionId),
        collection: "Submission",
      },
      metadata: {
        action: "submission_deleted",
        pointsReversed: pointsToReverse,
        wasFirstBlood: submission.isFirstBlood,
        userId: submission.user.toString(),
        challengeId: submission.challenge.toString(),
      },
    });
  }

  /**
   * Retrieves a list of submissions made by a user, filtered by correctness.
   *
   * @param {string} userId - The ID of the user to retrieve submissions for.
   * @param {number} [page=1] - The page number to retrieve.
   * @param {number} [limit=20] - The number of submissions to retrieve per page.
   * @param {boolean} [isCorrect] - Whether to filter by correctness or not.
   *
   * @returns {Promise<{submissions: ISubmission[], total: number, page: number, limit: number}>} - A promise which resolves to an object containing the list of submissions, total count, page number, and limit.
   * @throws {ApiError} 404 - User not found.
   */
  async getUserSubmissions(
    userId: string,
    page = 1,
    limit = 20,
    isCorrect?: boolean
  ) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const userExists = await User.exists({ _id: userId });
    if (!userExists) throw new ApiError(404, "User not found");

    const query: Record<string, unknown> = { user: userId };
    if (isCorrect !== undefined) query.isCorrect = isCorrect;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate("challenge", "title slug category difficulty points")
        .populate("team", "name")
        .select("-flagHash")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments(query),
    ]);

    return { submissions, total, page, limit };
  }
}

export const submissionService = new SubmissionService();
