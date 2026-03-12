import { Types } from "mongoose";
import Challenge, {
  ChallengeDifficulty,
  IChallenge,
} from "../../models/challenge.model";
import { ApiError } from "../../utils/ApiError";
import crypto from "crypto";
import Submission, { ISubmissionModel } from "../../models/submission.model";
import {
  DIFFICULTY_SORT_ORDER,
  FLAG_SHARE_ALERT_THRESHOLD,
  MAX_FLAG_ATTEMPTS_PER_WINDOW,
  RATE_LIMIT_WINDOW_MS,
} from "../../utils/constants";
import logger from "../../utils/logger";
import User from "../../models/user.model";
import { calculateDynamicPoints } from "../../utils/helpers";
import { challengeFilters } from "./challenge.types";
import Team from "../../models/team.model";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";

class ChallengeService {
  // Private helpers

  /**
   * Fetch a visible, active challenge. Throws 404 if not found.
   */
  private async findVisibleChallenge(idOrSlug: string): Promise<IChallenge> {
    const query = Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug, isVisible: true, isActive: true }
      : { slug: idOrSlug, isVisible: true, isActive: true };

    const challenge = await Challenge.findOne(query);

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    return challenge;
  }

  /**
   * Fetch any active challenge for admin ops (visible or not).
   */
  private async findActiveChallenges(id: string): Promise<IChallenge> {
    const challenge = await Challenge.findOne({
      _id: id,
      isActive: true,
    }).select("+flag");

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    return challenge;
  }

  /**
   * Hash a flag string consistently with sha256.
   * Respects case sensitivity setting.
   */
  private hashFlag(flag: string, caseSensitive: boolean): string {
    const normalized = caseSensitive ? flag.trim() : flag.trim().toLowerCase();

    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Enforce per-user-per-challenge rate limit using Submission.countRecentFailures.
   * Throws 429 if exceeded.
   */
  private async enforceRateLimit(
    userId: Types.ObjectId,
    challengeId: Types.ObjectId
  ): Promise<void> {
    const recentFails = await Submission.countRecentFailures(
      userId,
      challengeId,
      RATE_LIMIT_WINDOW_MS
    );

    if (recentFails >= MAX_FLAG_ATTEMPTS_PER_WINDOW) {
      throw new ApiError(
        429,
        `Too many incorrect attempts. Please wait before trying again.`
      );
    }
  }

  private readonly _flagShareMap = new Map<string, Set<string>>();

  /**
   * Track flag sharing between users by storing the IPs that submit the same correct flag.
   * Logs a warning if the number of unique IPs submitting the same flag exceeds the threshold.
   * @param challengeId - The id of the challenge being tracked.
   * @param flag - The correct flag being tracked.
   * @param ip - The IP address of the user submitting the flag.
   */
  private trackFlagShare(challengeId: string, flag: string, ip: string): void {
    const key = `${challengeId}:${this.hashFlag(flag, true)}`;
    const ips = this._flagShareMap.get(key) ?? new Set<string>();

    ips.add(ip);
    this._flagShareMap.set(key, ips);

    if (ips.size >= FLAG_SHARE_ALERT_THRESHOLD) {
      logger.warn(
        `[ANTI-CHEAT] Flag sharing detected on challenge ${challengeId}: ` +
          `${ips.size} unique IPs submitted the same correct flag.`
      );
    }
  }

  // player operations

  /**
   * Fetch a list of challenges matching given filters.
   * Optional authentication: if provided, annotates challenges with whether the user has solved them.
   * @param filters - Optional filters for category, difficulty, tags, search, page, limit, sortBy, sortOrder
   * @param userId - Optional user id for annotation
   * @returns List of challenges with current points, isSolved status for authenticated user.
   */
  async getChallenges(filters: challengeFilters, userId?: Types.ObjectId) {
    const {
      category,
      difficulty,
      tags,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    const query: Record<string, unknown> = { isVisible: true, isActive: true };

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (tags?.length) {
      query.tags = { $in: tags };
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Build mongo sort - difficulty handled post-query
    const mongoSortMap: Record<string, Record<string, 1 | -1>> = {
      points: { points: sortOrder === "asc" ? 1 : -1 },
      solveCount: { solvecount: sortOrder === "asc" ? 1 : -1 },
      difficulty: { points: 1 },
    };

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .select("-flag")
        .populate("firstBlood.user", "username avatar")
        .sort(mongoSortMap[sortBy] ?? { points: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Challenge.countDocuments(query),
    ]);

    // Clint-side difficulty sort (MongoDB can't sort by custom enum order)
    if (sortBy === "difficulty") {
      challenges.sort((a, b) => {
        const diff =
          DIFFICULTY_SORT_ORDER[a.difficulty as ChallengeDifficulty] -
          DIFFICULTY_SORT_ORDER[b.difficulty as ChallengeDifficulty];

        return sortOrder === "asc" ? diff : -diff;
      });
    }

    // Preload solved challenges for this user
    let solvedSet = new Set<string>();

    if (userId) {
      const user = await User.findById(userId)
        .select("solvedChallenges")
        .lean();
      solvedSet = new Set(
        user?.solvedChallenges.map((id) => id.toString()) ?? []
      );
    }

    const annotated = challenges.map((c) => ({
      ...c,
      currentPoints: calculateDynamicPoints(
        c.points,
        c.solveCount,
        c.scoringType,
        c.minPoints
      ),
      isSolved: solvedSet.has(c._id.toString()),
    }));

    return { challenges: annotated, total, page, limit };
  }

  /**
   * Fetch a challenge by its id or slug.
   * If the challenge is not visible or active, throw 404.
   * Populate firstBlood, recentSolves, author with username, avatar, country.
   * Populate recentSolves team with name, avatar.
   * For authenticated users, check if the challenge has been solved,
   * and if any hints have been purchased.
   * @param IdOrSlug - The id or slug of the challenge.
   * @param userId - Optional user id for purchased hint set and solve status.
   * @returns A challenge object with hints, isSolved, currentPoints.
   * @throws {ApiError} 404 if the challenge is not found.
   */
  async getChallengeDetail(IdOrSlug: string, userId?: Types.ObjectId) {
    const challenge = await Challenge.findOne(
      Types.ObjectId.isValid(IdOrSlug)
        ? {
            _id: IdOrSlug,
            isVisible: true,
            isActive: true,
          }
        : {
            slug: IdOrSlug,
            isVisible: true,
            isActive: true,
          }
    )
      .populate("firstBlood.user", "username avatar country")
      .populate("recentSolves.user", "username avatar country")
      .populate("recentSolves.team", "name avatar")
      .populate("author", "username")
      .lean();

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    // purchased hint set and solve status for authenticated user
    let purchasedHintIndices = new Set<number>();
    let isSolved = false;

    if (userId) {
      const user = await User.findById(userId)
        .select("hintsPurchased solvedChallenges")
        .lean();

      isSolved =
        user?.solvedChallenges.some(
          (id) => id?.toString() === challenge?._id.toString()
        ) ?? false;

      purchasedHintIndices = new Set(
        user?.hintsPurchased
          ?.filter(
            (h) => h.challengeId.toString() === challenge?._id.toString()
          )
          .map((h) => h.hintIndex) ?? []
      );
    }

    // Mask unpurchased hint text -reveal cost and order only
    const hints = challenge.hints.map((hint, i) => ({
      _id: hint._id,
      cost: hint.cost,
      order: hint.order,
      isPurchased: purchasedHintIndices.has(i),
      // Text only if purchased or already solved
      text: purchasedHintIndices.has(i) || isSolved ? hint.text : null,
    }));

    return {
      ...challenge,
      hints,
      isSolved,
      currentPoints: calculateDynamicPoints(
        challenge.points,
        challenge.solveCount,
        challenge.scoringType,
        challenge.minPoints
      ),
    };
  }

  async submitFlag(data: SubmitFlagInput): Promise<SubmitFlagResult> {
    const { userId, teamId, challengeId, flag, ip, userAgent } = data;

    const challengeObjId = new Types.ObjectId(challengeId);

    // Rate - limit - 5 wrong attempts / min per user per challenge
    await this.enforceRateLimit(userId, challengeObjId);

    // Fetch challenge with flag field
    const challenge = await Challenge.findOne({
      _id: challengeId,
      isVisible: true,
      isActive: true,
    }).select("+flag");

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    // closed check
    if (challenge.closedAt && challenge.closedAt < new Date()) {
      throw new ApiError(400, "This challenge has closed");
    }

    // Already solved by user
    const alreadySolved = await Submission.exists({
      user: userId,
      challenge: challengeId,
      isCorrect: true,
    });

    if (alreadySolved) {
      throw new ApiError(409, "You have already solved this challenge");
    }

    // verify flag
    const submittedHash = this.hashFlag(flag, challenge.isCaseSensitive);
    const isCorrect = submittedHash === challenge.flag;

    // Snapshot points BEFORE sovleCount increments (important for dynamic scoring)
    const pointsAwarded = isCorrect ? challenge.getCurrentPoints() : 0;

    // Determine first blood
    const isFirstBlood = isCorrect && !challenge.firstBlood;

    // Peristent submission
    const submission = new Submission({
      user: userId,
      challenge: challengeId,
      team: teamId ?? null,
      isCorrect,
      pointsAwarded,
      isFirstBlood,
      meta: {
        ipAddress: ip,
        userAgent,
      },
    });

    // Pass raw flag via transient _rawflag so the model hashes it
    (submission as unknown as { _rawFlag: string })._rawFlag = flag;
    await submission.save();

    challenge.totalAttempts = (challenge.totalAttempts ?? 0) + 1;

    if (!isCorrect) {
      await challenge.save({ validateBeforeSave: false });

      return {
        isCorrect: false,
        pointsAwarded: 0,
        isFirstBlood: false,
        message: "Incorrect flag. Try again.",
      };
    }

    // Anti-cheat tracking
    this.trackFlagShare(challengeId, flag, ip);

    // record solve on challenge document
    await challenge.recordSolve(userId, teamId);

    // Award points to user and team atomatically
    const [updatedUser] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { solvedChallenges: challengeId },
          $inc: { score: pointsAwarded },
        },
        { new: true }
      ).select("score"),

      teamId &&
        Team.findByIdAndUpdate(teamId, {
          $addToSet: { solvedChallenges: challengeId },
          $inc: { score: pointsAwarded },
        }),
    ]);

    // Audit log
    await (AuditLog as unknown as IAuditLogModel).record({
      action: isFirstBlood ? "submission:first_blood" : "submission:correct",
      outcome: "success",
      actor: {
        userId,
        username: null,
        role: null,
        type: "user",
      },
      target: {
        id: challenge._id as Types.ObjectId,
        collection: "Challenge",
        label: challenge.title,
      },
      metadata: {
        pointsAwarded,
        isFirstBlood,
        solveCount: challenge.solveCount,
      },
    });

    return {
      isCorrect: true,
      pointsAwarded,
      isFirstBlood,
      newScore: updatedUser?.score,
      message: isFirstBlood
        ? `🩸 First blood! +${pointsAwarded} points`
        : `Correct! +${pointsAwarded} points`,
    };
  }
}

export const challengeService = new ChallengeService();
