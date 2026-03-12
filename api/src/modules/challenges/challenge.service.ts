import { Types } from "mongoose";
import Challenge, {
  ChallengeDifficulty,
  IChallenge,
} from "../../models/challenge.model";
import { ApiError } from "../../utils/ApiError";
import crypto from "crypto";
import Submission from "../../models/submission.model";
import {
  DIFFICULTY_SORT_ORDER,
  FLAG_SHARE_ALERT_THRESHOLD,
  MAX_FLAG_ATTEMPTS_PER_WINDOW,
  RATE_LIMIT_WINDOW_MS,
} from "../../utils/constants";
import logger from "../../utils/logger";
import User from "../../models/user.model";
import { calculateDynamicPoints } from "../../utils/helpers";
import {
  AddHintInput,
  challengeFilters,
  CreateChallengePayload,
  purchasedHintResult,
  SubmitFlagPayload,
  SubmitFlagResult,
  UpdateChallengeInput,
} from "./challenge.types";
import Team from "../../models/team.model";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import escapeStringRegexp from "escape-string-regexp";

class ChallengeService {
  private ALLOWED_CHALLENGE_UPDATE_FIELDS = [
    "title",
    "description",
    "difficulty",
    "points",
    "category",
    "flag",
    "isVisible",
  ];

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
      query.title = { $regex: escapeStringRegexp(search), $options: "i" };
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

  /**
   * Submit a flag for a challenge.
   * @param data - Payload containing the user, team, challenge, flag, IP, and user agent.
   * @returns A promise resolving to a SubmitFlagResult object.
   * @throws ApiError - If the challenge does not exist, is not visible, or has already been solved by the user.
   */
  async submitFlag(data: SubmitFlagPayload): Promise<SubmitFlagResult> {
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

  /**
   * Purchases a hint for a challenge.
   * Returns the text of the hint, the points deducted from the user's score,
   * and the index of the hint purchased.
   *
   * If the user has already solved the challenge, the hint text is returned
   * for free.
   *
   * If the user has already purchased the hint, the function returns immediately
   * without deducting points or modifying the user's document.
   *
   * @throws {ApiError} 400 - Invalid hint index
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 400 - Insufficient points
   */
  async purchaseHint(
    challengeId: string,
    hintIndex: number,
    userId: Types.ObjectId
  ): Promise<purchasedHintResult> {
    const challenge = await this.findVisibleChallenge(challengeId);

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      throw new ApiError(
        400,
        `Invalid hint index. This challenge has ${challenge.hints.length} hint(s).`
      );
    }

    const user = await User.findById(userId).select(
      "hintsPurchased score solvedChallenges"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Already solved - return hint text for free

    const alreadySolved = user.solvedChallenges.some(
      (id) => id.toString() === challengeId
    );

    if (alreadySolved) {
      return {
        hintText: challenge.hints[hintIndex].text,
        pointsDeducted: 0,
        hintIndex,
      };
    }

    // Already purchased - idempotent return

    const alreadyPurchased = user.hintsPurchased?.some(
      (h) =>
        h.challengeId.toString() === challengeId && h.hintIndex === hintIndex
    );

    if (alreadyPurchased) {
      return {
        hintText: challenge.hints[hintIndex].text,
        pointsDeducted: 0,
        hintIndex,
      };
    }

    const hint = challenge.hints[hintIndex];

    if (hint.cost > 0 && user.score < hint.cost) {
      throw new ApiError(
        400,
        `Insufficient points. This hint costs ${hint.cost} points. You have ${user.score}.`
      );
    }

    const pointsDeducted = hint.cost;

    user.score = Math.max(0, user.score - pointsDeducted);
    user.hintsPurchased = user.hintsPurchased ?? [];

    user.hintsPurchased.push({
      challengeId: new Types.ObjectId(challengeId),
      hintIndex,
      purchasedAt: new Date(),
    });

    await user.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "submission:hint_purchase",
      outcome: "success",
      actor: { userId, username: null, role: null, type: "user" },
      target: {
        id: challenge._id as Types.ObjectId,
        collection: "Challenge",
        label: challenge.title,
      },
      metadata: {
        hintIndex,
        pointsDeducted,
      },
    });
    return {
      hintText: hint.text,
      pointsDeducted,
      hintIndex,
    };
  }

  /**
   * Retrieve a list of solves for a challenge, sorted newest-first.
   * Optional pagination: page and limit.
   * @param {string} challengeId - The challenge to fetch solves for.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=20] - The number of solves to fetch per page.
   * @returns {Promise<{
   *   solves: ISubmission[],
   *   total: number,
   *   page: number,
   *   limit: number,
   * }>} - A promise which resolves to an object containing the list of solves, total number of solves, page number and limit.
   */
  async getChallengeSolves(challengeId: string, page = 1, limit = 20) {
    // confirm challenge exists and visible

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
      Submission.find({
        challenge: challengeId,
        isCorrect: true,
      })
        .populate("user", "username avatar country")
        .populate("team", "name avatar")
        .select(
          "user team pointsAwarded isFirstBlood createdAt meta.solveTimeSeconds"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments({ challenge: challengeId, isCorrect: true }),
    ]);

    return {
      solves,
      total,
      page,
      limit,
    };
  }

  // Admin Operations

  /**
   * Creates a new challenge. The challenge will not be visible until the 'isVisible' field is explicitly set to true.
   * @param {CreateChallengePayload} data - The challenge data to create with.
   * @returns {Promise<IChallenge>} - A promise which resolves to the newly created challenge.
   * @throws {ApiError} 400 - If a challenge with the same title already exists.
   * @throws {ApiError} 500 - If the challenge creation fails.
   */
  async createChallenge(data: CreateChallengePayload): Promise<IChallenge> {
    const exists = await Challenge.findOne({
      title: { $regex: new RegExp(`^${escapeStringRegexp(data.title)}$`, "i") },
    });

    if (exists) {
      throw new ApiError(400, "Challenge title already exists");
    }

    const challenge = await Challenge.create({
      ...data,
      author: data.authorId,
      isVisible: false, // must be explicitly set
    });

    if (!challenge) {
      throw new ApiError(500, "Failed to create challenge");
    }

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "challenge:create",
      outcome: "success",
      actor: {
        userId: data.authorId,
        username: null,
        role: "admin",
        type: "admin",
      },
      target: {
        id: challenge._id as Types.ObjectId,
        collection: "Challenge",
        label: challenge.title,
      },
    });

    return challenge;
  }

  /**
   * Updates a challenge with the given data. The challenge must be visible.
   * @param {string} challengeId - The id of the challenge to update.
   * @param {UpdateChallengeInput} data - The challenge data to update with.
   * @param {Types.ObjectId} requesterId - The id of the user performing the update.
   * @returns {Promise<IChallenge>} - A promise which resolves to the updated challenge.
   * @throws {ApiError} 400 - If the challenge title already exists, or if the update contains invalid fields.
   * @throws {ApiError} 500 - If the challenge update fails.
   */
  async updateChallenge(
    challengeId: string,
    data: UpdateChallengeInput,
    requesterId: Types.ObjectId
  ): Promise<IChallenge> {
    const challenge = await this.findActiveChallenges(challengeId);

    if (data.title && data.title !== challenge.title) {
      const duplicate = await Challenge.findOne({
        title: {
          $regex: new RegExp(`^${escapeStringRegexp(data.title)}$`, "i"),
        },
        _id: { $ne: challengeId },
      });

      if (duplicate) {
        throw new ApiError(400, "Challenge title already exists");
      }
    }

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const changedFields: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (
        !this.ALLOWED_CHALLENGE_UPDATE_FIELDS.includes(key) ||
        value === undefined
      )
        continue;

      const currentVal = challenge.get(key);

      if (JSON.stringify(currentVal) !== JSON.stringify(value)) {
        before[key] = currentVal;
        after[key] = value;
        changedFields.push(key);

        challenge.set(key, value);
      }
    }

    await challenge.save();

    if (changedFields.length > 0) {
      await (AuditLog as unknown as IAuditLogModel).record({
        action: "challenge:update",
        outcome: "success",
        actor: {
          userId: requesterId,
          username: null,
          role: "admin",
          type: "admin",
        },
        target: {
          id: challenge._id as Types.ObjectId,
          collection: "Challenge",
          label: challenge.title,
        },
        diff: {
          before,
          after,
          changedFields,
        },
      });
    }

    return challenge;
  }

  /**
   * Sets the visibility of a challenge.
   * @param {string} challengeId The id of the challenge to update.
   * @param {boolean} isVisible Whether the challenge should be visible.
   * @param {Types.ObjectId} requesterId The id of the user performing the action.
   * @returns {Promise<IChallenge>} The updated challenge document.
   */
  async setVisibility(
    challengeId: string,
    isVisible: boolean,
    requesterId: Types.ObjectId
  ): Promise<IChallenge> {
    const challenge = await this.findActiveChallenges(challengeId);

    const wasVisible = challenge.isVisible;
    challenge.isVisible = isVisible;
    await challenge.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: isVisible ? "challenge:publish" : "challenge:archive",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: null,
        role: "admin",
        type: "admin",
      },
      target: {
        id: challenge._id as Types.ObjectId,
        collection: "Challenge",
        label: challenge.title,
      },
      metadata: {
        wasVisible,
        isVisible,
      },
    });

    return challenge;
  }

  /**
   * Soft-deletes a challenge by setting isActive and isVisible to false.
   * Audit logs the action with the deleting user and the challenge title.
   * Throws 404 if the challenge is not found.
   * @param {string} challengeId - The id of the challenge to delete.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @returns {Promise<void>} - A promise which resolves when the challenge has been deleted.
   */
  async deleteChallenge(
    challengeId: string,
    requesterId: Types.ObjectId
  ): Promise<void> {
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    challenge.isActive = false;
    challenge.isVisible = false;
    await challenge.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "challenge:delete",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: null,
        role: "admin",
        type: "admin",
      },
      target: {
        id: challenge._id as Types.ObjectId,
        collection: "challenge",
        label: challenge.title,
      },
    });
  }

  /**
   * Adds a hint to a challenge.
   * Throws 409 if a hint with the given order already exists.
   * Audit logs the action with the adding user and the challenge title.
   * @param {string} challengeId - The id of the challenge to add the hint to.
   * @param {AddHintInput} hint - The hint to add.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @returns {Promise<IChallenge>} - A promise which resolves to the updated challenge.
   */
  async addHint(
    challengeId: string,
    hint: AddHintInput,
    requesterId: Types.ObjectId
  ): Promise<IChallenge> {
    const challenge = await this.findActiveChallenges(challengeId);

    // Enforce unique order values
    const orderExits = challenge.hints.some((h) => h.order === hint.order);

    if (orderExits) {
      throw new ApiError(409, `A hint with order ${hint.order} already exists`);
    }

    challenge.hints.push(hint as never);

    await challenge.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "challenge:hint_add",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: null,
        role: "admin",
        type: "admin",
      },
      target: {
        id: challenge._id as Types.ObjectId,
        collection: "Challenge",
        label: challenge.title,
      },
      metadata: {
        hintOrder: hint.order,
        cost: hint.cost,
      },
    });

    return challenge;
  }

  /**
   * Removes a hint from a challenge.
   * @param {string} challengeId - The id of the challenge to remove the hint from.
   * @param {number} hintIndex - The index of the hint to remove.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @returns {Promise<IChallenge>} - A promise which resolves to the updated challenge document.
   * @throws {ApiError} 400 - If the hint index is invalid.
   */
  async removeHint(
    challengeId: string,
    hintIndex: number,
    requesterId: Types.ObjectId
  ): Promise<IChallenge> {
    const challenge = await this.findActiveChallenges(challengeId);

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      throw new ApiError(400, "Invalid hint index");
    }

    challenge.hints.splice(hintIndex, 1);
    await challenge.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "challenge:hint_remove",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: null,
        role: "admin",
        type: "admin",
      },
      metadata: { hintIndex },
    });

    return challenge;
  }
}

export const challengeService = new ChallengeService();
