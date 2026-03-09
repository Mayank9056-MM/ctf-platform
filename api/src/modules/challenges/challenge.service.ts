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
}

export const challengeService = new ChallengeService();
