import { Types } from "mongoose";
import Challenge, {
  ChallengeDifficulty,
  IChallenge,
} from "../../models/challenge.model";
import { ApiError } from "../../utils/ApiError";
import Submission, { ISubmission } from "../../models/submission.model";
import { DIFFICULTY_SORT_ORDER } from "../../utils/constants";
import User from "../../models/user.model";
import { calculateDynamicPoints } from "../../utils/helpers";
import {
  AddAttachmentInput,
  AddHintInput,
  AdminChallengeStats,
  challengeFilters,
  CreateChallengePayload,
  purchasedHintResult,
  UpdateChallengeInput,
} from "./challenge.types";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";

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

    const escapeStringRegexp = (await import("escape-string-regexp")).default;

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
  async getChallengeSolves(
    challengeId: string,
    page = 1,
    limit = 20
  ): Promise<{
    solves: ISubmission[];
    total: number;
    page: number;
    limit: number;
  }> {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    // confirm challenge exists and visible
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
    const escapeStringRegexp = (await import("escape-string-regexp")).default;

    const exists = await Challenge.findOne({
      title: {
        $regex: new RegExp(`^${escapeStringRegexp(data.title)}$`, "i"),
      },
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

    const escapeStringRegexp = (await import("escape-string-regexp")).default;

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

  /**
   * Adds an attachment to a challenge.
   * @param {string} challengeId - The id of the challenge to add the attachment to.
   * @param {AddAttachmentInput} attachment - The attachment data to add.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @returns {Promise<IChallenge>} - A promise which resolves to the updated challenge document.
   * @throws {ApiError} 400 - If the challenge is not found.
   */
  async addAttachment(
    challengeId: string,
    attachment: AddAttachmentInput,
    requesterId: Types.ObjectId
  ): Promise<IChallenge> {
    const challenge = await this.findActiveChallenges(challengeId);

    challenge.attachments.push({
      ...attachment,
      uploadedAt: new Date(),
    } as never);
    await challenge.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "challenge:attachment_add",
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
        fileName: attachment.name,
        size: attachment.size,
      },
    });
    return challenge;
  }

  /**
   * Removes an attachment from a challenge.
   * @param {string} challengeId - The id of the challenge to remove the attachment from.
   * @param {string} attachmentId - The id of the attachment to remove.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @returns {Promise<IChallenge>} - A promise which resolves to the updated challenge document.
   * @throws {ApiError} 404 - If the attachment is not found.
   */
  async removeAttachment(
    challengeId: string,
    attachmentId: string,
    requesterId: Types.ObjectId
  ): Promise<IChallenge> {
    const challenge = await this.findActiveChallenges(challengeId);

    const idx = challenge.attachments.findIndex(
      (a) => a._id.toString() === attachmentId
    );

    if (idx === -1) {
      throw new ApiError(404, "Attachment not found");
    }

    const removed = challenge.attachments[idx];
    challenge.attachments.splice(idx, 1);
    await challenge.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "challenge:attachment_remove",
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
        fileName: removed.name,
      },
    });

    return challenge;
  }

  /**
   * Retrieves a list of active challenges for admin ops.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=50] - The number of challenges to fetch per page.
   * @returns A promise which resolves to an object containing the list of challenges, total number of challenges, page number, and limit.
   * @throws {ApiError} 404 - If no challenges are found.
   */
  async getAdminChallenges(page = 1, limit = 50) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const [challenges, total] = await Promise.all([
      Challenge.find({
        isActive: true,
      })
        .select("-flag")
        .populate("author", "username avatar")
        .sort({ createAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Challenge.countDocuments({ isActive: true }),
    ]);

    if (!challenges) {
      throw new ApiError(404, "Challenges not found");
    }

    return {
      challenges,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves aggregated statistics for admin ops.
   * @returns A promise which resolves to an object containing statistics by category, total number of challenges, visible challenges, and total solves.
   */
  async getAdminStats(): Promise<AdminChallengeStats> {
    const [byCategory, totals] = await Promise.all([
      Challenge.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalSolves: { $sum: "$solveCount" },
            avgPoints: { $avg: "$points" },
            visible: { $sum: { $cond: ["$isVisible", 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Challenge.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            visible: { $sum: { $cond: ["$isVisible", 1, 0] } },
            totalSolves: { $sum: "$solveCount" },
          },
        },
      ]),
    ]);

    return {
      byCategory,
      totals: totals[0] ?? { total: 0, visible: 0, totalSolves: 0 },
    };
  }

  /**
   * Retrieve a list of submissions for a challenge, sorted newest-first.
   * Optional filtration: isCorrect (true/false) to filter by correct/incorrect submissions.
   * Optional pagination: page and limit.
   * @param {string} challengeId - The challenge to fetch submissions for.
   * @param {number} [page=1] - The page number to fetch.
   * @param {number} [limit=50] - The number of submissions to fetch per page.
   * @param {boolean} [isCorrect] - Optional filtration by correct/incorrect submissions.
   * @returns {Promise<{
   *   submissions: ISubmission[],
   *   total: number,
   *   page: number,
   *   limit: number
   * }>} - A promise which resolves to an object containing the list of submissions, total number of submissions, page number and limit.
   */
  async getAdminSubmissions(
    challengeId: string,
    page = 1,
    limit = 50,
    isCorrect?: boolean
  ): Promise<{
    submissions: ISubmission[];
    total: number;
    page: number;
    limit: number;
  }> {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const query: Record<string, unknown> = { challenge: challengeId };
    if (isCorrect !== undefined) query.isCorrect = isCorrect;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate("user", "username email avatar")
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

  /**
   * Retrieves a challenge by its id, only if it is active.
   * Throws 400 if challengeId is not provided, and 404 if the challenge is not found.
   * @param {string} challengeId - The id of the challenge to fetch.
   * @returns {Promise<IChallenge>} - A promise which resolves to the challenge if found, or throws an error if not found.
   */
  async getAdminChallengesById(challengeId: string): Promise<IChallenge> {
    if (!challengeId) {
      throw new ApiError(400, "Challenge id is required");
    }

    const challenge = await Challenge.findOne({
      _id: challengeId,
      isActive: true,
    }).lean();

    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }
    return challenge;
  }

  /**
   * Retrieves the raw flag for a challenge by its id.
   * Throws 400 if challengeId is not provided, and 404 if the challenge is not found.
   * @param {string} challengeId - The id of the challenge to fetch the flag for.
   * @returns {Promise<string>} - A promise which resolves to the flag if found, or throws an error if not found.
   */
  async getRawFlag(challengeId: string): Promise<string> {
    if (!challengeId) {
      throw new ApiError(400, "Challenge id is required");
    }

    // Retrieve stored hash — admins verify flag before embedding
    const challenge = await Challenge.findOne({
      _id: challengeId,
      isActive: true,
    })
      .select("+flag")
      .lean();

    if (!challenge) throw new ApiError(404, "Challenge not found");
    return challenge.flag;
  }
}

export const challengeService = new ChallengeService();
