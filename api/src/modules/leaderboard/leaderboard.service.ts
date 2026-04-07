import { Types } from "mongoose";
import {
  ComputedBoardData,
  LeaderboardFilters,
  LeaderboardResponse,
} from "./leaderboard.types";
import Leaderboard, {
  ILeaderboardEntry,
  ILeaderboardModel,
  LeaderboardScope,
} from "../../models/leaderboard.model";
import { ApiError } from "../../utils/ApiError";
import logger from "../../utils/logger";
import User from "../../models/user.model";
import Submission from "../../models/submission.model";
import Team from "../../models/team.model";
import Event from "../../models/event.model";

/** How many entries to store in the embedded snapshot */
const SNAPSHOT_TOP_N = 500;

// Service

class LeaderboardService {
  // Public Read

  /**
   * Retrieve a leaderboard with pagination.
   *
   * The first request or no snapshot — compute now (cold start).
   * Subsequent requests will return the cached snapshot.
   *
   * If the requesting user's ID is provided, the service will find their entry
   * (even outside top-N) and include it in the response.
   *
   * @param {LeaderboardFilters} filters - The filters to apply to the leaderboard query.
   * @param {Types.ObjectId} [requesterId] - The ID of the requesting user.
   * @returns {Promise<LeaderboardResponse>} - The response containing the leaderboard entries and metadata.
   */
  async getLeaderboard(
    filters: LeaderboardFilters,
    requesterId?: Types.ObjectId
  ): Promise<LeaderboardResponse> {
    const { scope, eventId, page, limit } = filters;

    const eventObjId = eventId ? new Types.ObjectId(eventId) : undefined;

    const boardFilter: Record<string, unknown> = { scope };
    boardFilter.eventId = eventObjId ?? null;

    let board = await Leaderboard.findOne(boardFilter).lean();

    // First request or no snapshot — compute now (cold start)
    if (!board) {
      await this.recompute(scope, eventObjId);
      board = await Leaderboard.findOne(boardFilter).lean();
    }

    if (!board) {
      throw new ApiError(404, "Leaderboard not found");
    }

    const total = board.totalCount;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    // Slice the in-memory snapshot for pagination
    const paginatedEntries = board.entries.slice(start, end);

    // Find the requesting user's own entry (even outside top-N)
    let myEntry: (ILeaderboardEntry & { rank: number }) | undefined;

    if (requesterId) {
      const found = board.entries.find(
        (e) => e.entityId.toString() === requesterId.toString()
      );

      if (found) {
        myEntry = { ...found, rank: found.rank };
      } else if (scope === "global_user" || scope === "event_user") {
        // User may be outside the top-N snapshot — compute their rank on-demand
        myEntry = await this.getUserRankOutsideSnapshot(
          requesterId,
          scope,
          eventObjId
        );
      }
    }

    return {
      scope: board.scope,
      eventId: board.eventId?.toString(),
      isFrozen: board.isFrozen,
      frozenAt: board.frozenAt?.toISOString(),
      isStale: board.isStale,
      computedAt: board.computedAt.toISOString(),
      ageSeconds: Math.floor((Date.now() - board.computedAt.getTime()) / 1000),
      entries: paginatedEntries,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      myEntry,
    };
  }

  // Recompute

  /**
   * Recompute a leaderboard.
   * Called by the cron job.
   * @param scope The scope of the leaderboard to recompute.
   * @param eventId The ID of the event to recompute the leaderboard for, if applicable.
   * @returns A promise that resolves when the recompute is complete.
   */
  async recompute(
    scope: LeaderboardScope,
    eventId?: Types.ObjectId
  ): Promise<void> {
    const start = Date.now();
    logger.info(
      `[LeaderboardService] Computing "${scope}" leaderboard${eventId ? ` for event ${eventId}` : ""}...`
    );

    let data: ComputedBoardData;

    switch (scope) {
      case "global_user":
        data = await this.computeGlobalUserBoard();
        break;
      case "global_team":
        data = await this.computeGlobalTeamBoard();
        break;
      case "event_user":
        if (!eventId) throw new Error("eventId required for event_user");
        data = await this.computeEventUserBoard(eventId);
        break;
      case "event_team":
        if (!eventId) throw new Error("eventId required for event_team");
        data = await this.computeEventTeamBoard(eventId);
        break;
      default:
        throw new Error(`Unknown scope: ${scope}`);
    }

    await (Leaderboard as unknown as ILeaderboardModel).upsertBoard(
      scope,
      data,
      eventId
    );

    logger.info(
      `[LeaderboardService] "${scope}" computed in ${Date.now() - start}ms — ${data.totalCount} entries`
    );
  }

  /**
   * Recompute all stale leaderboards.
   * Called by the cron job.
   * @returns A promise that resolves to an array of objects containing the scope and duration of each recompute.
   */
  async recomputeStale(): Promise<{ scope: string; durationMs: number }[]> {
    const stale = await (
      Leaderboard as unknown as ILeaderboardModel
    ).findStale();

    const results: { scope: string; durationMs: number }[] = [];

    for (const board of stale) {
      const t = Date.now();
      try {
        await this.recompute(
          board.scope,
          board.eventId as Types.ObjectId | undefined
        );
        results.push({ scope: board.scope, durationMs: Date.now() - t });
      } catch (err) {
        logger.error(
          `[LeaderboardService] Recompute failed for "${board.scope}": ${(err as Error).message}`
        );
      }
    }

    return results;
  }

  /**
   * Mark a leaderboard as stale. Called whenever a correct submission lands so the next cron tick (or on-demand call) knows to recompute.
   * @param {LeaderboardScope} scope What the leaderboard ranks.
   * @param {Types.ObjectId} [eventId] Optional event ID for event-scoped boards.
   * @returns {Promise<void>}
   */
  async markStale(
    scope: LeaderboardScope,
    eventId?: Types.ObjectId
  ): Promise<void> {
    await (Leaderboard as unknown as ILeaderboardModel).markStale(
      scope,
      eventId
    );
  }

  // Freeze (event scoreboard)

  /**
   * Set the frozen state of a leaderboard.
   * Updates all leaderboards for the event with the given eventId and scope in ["event_user", "event_team"].
   * @param {Types.ObjectId} eventId The ID of the event to freeze the leaderboard for.
   * @param {boolean} frozen Whether the leaderboard should be frozen (true) or not (false).
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  async setFrozen(eventId: Types.ObjectId, frozen: boolean): Promise<void> {
    const now = new Date();

    await Leaderboard.updateMany(
      { eventId, scope: { $in: ["event_user", "event_team"] } },
      {
        $set: {
          isFrozen: frozen,
          frozenAt: frozen ? now : null,
        },
      }
    );
  }

  // Private: computation pipelines

  /**
   * Compute the global leaderboard for all users.
   * @returns An object containing the computed leaderboard data, including the entries and total count.
   */
  private async computeGlobalUserBoard(): Promise<ComputedBoardData> {
    const pipeline = [
      { $match: { isDeleted: false, isBanned: false } },
      {
        $project: {
          _id: 1,
          username: 1,
          avatar: 1,
          country: 1,
          teamId: 1,
          score: 1,
          solvedChallenges: 1,
          firstBloods: { $literal: 0 }, // computed below via lookup
        },
      },
      { $sort: { score: -1, updatedAt: 1 } as Record<string, 1 | -1> },
      { $limit: SNAPSHOT_TOP_N },
    ];

    const users = await User.aggregate(pipeline);

    // Enrich with lastSolveAt and firstBloods from Submission
    const userIds = users.map((u) => u._id);

    const [solveMap, firstBloodMap] = await Promise.all([
      Submission.aggregate([
        { $match: { user: { $in: userIds }, isCorrect: true } },
        {
          $group: {
            _id: "$user",
            lastSolveAt: { $max: "$createdAt" },
          },
        },
      ]).then(
        (rows) =>
          new Map(rows.map((r) => [r._id.toString(), r.lastSolveAt as Date]))
      ),

      Submission.aggregate([
        { $match: { user: { $in: userIds }, isFirstBlood: true } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]).then(
        (rows) =>
          new Map(rows.map((r) => [r._id.toString(), r.count as number]))
      ),
    ]);

    // Enrich team names
    const teamIds = users.filter((u) => u.teamId).map((u) => u.teamId);
    const teams = teamIds.length
      ? await Team.find({ _id: { $in: teamIds } })
          .select("name")
          .lean()
      : [];
    const teamNameMap = new Map(teams.map((t) => [t._id.toString(), t.name]));

    const entries: ILeaderboardEntry[] = users.map((u, i) => ({
      rank: i + 1,
      entityId: u._id,
      entityType: "user" as const,
      username: u.username,
      avatar: u.avatar,
      country: u.country,
      teamId: u.teamId ?? undefined,
      teamName: u.teamId ? teamNameMap.get(u.teamId.toString()) : undefined,
      score: u.score,
      solveCount: u.solvedChallenges?.length ?? 0,
      firstBloods: firstBloodMap.get(u._id.toString()) ?? 0,
      lastSolveAt: solveMap.get(u._id.toString()),
    }));

    const totalCount = await User.countDocuments({
      isDeleted: false,
      isBanned: false,
    });

    return { entries, totalCount };
  }

  /**
   * Compute the global leaderboard for all teams.
   *
   * @returns An object containing the computed leaderboard data, including the entries and total count.
   */
  private async computeGlobalTeamBoard(): Promise<ComputedBoardData> {
    const teams = await Team.find({ isActive: true })
      .select("name avatar country score solvedChallenges members")
      .sort({ score: -1 })
      .limit(SNAPSHOT_TOP_N)
      .lean();

    const teamIds = teams.map((t) => t._id);

    const firstBloodMap = await Submission.aggregate([
      { $match: { team: { $in: teamIds }, isFirstBlood: true } },
      { $group: { _id: "$team", count: { $sum: 1 } } },
    ]).then(
      (rows) => new Map(rows.map((r) => [r._id.toString(), r.count as number]))
    );

    const lastSolveMap = await Submission.aggregate([
      { $match: { team: { $in: teamIds }, isCorrect: true } },
      { $group: { _id: "$team", lastSolveAt: { $max: "$createdAt" } } },
    ]).then(
      (rows) =>
        new Map(rows.map((r) => [r._id.toString(), r.lastSolveAt as Date]))
    );

    const entries: ILeaderboardEntry[] = teams.map((t, i) => ({
      rank: i + 1,
      entityId: t._id,
      entityType: "team" as const,
      username: t.name,
      avatar: t.avatar ? { url: t.avatar } : undefined,
      country: t.country,
      score: t.score,
      solveCount: t.solvedChallenges?.length ?? 0,
      firstBloods: firstBloodMap.get(t._id.toString()) ?? 0,
      lastSolveAt: lastSolveMap.get(t._id.toString()),
    }));

    const totalCount = await Team.countDocuments({ isActive: true });

    return { entries, totalCount };
  }

  /**
   * Compute the leaderboard for an event based on user scores.
   *
   * @param eventId - The ID of the event
   * @returns A promise resolving to an object containing the leaderboard
   * entries and metadata.
   */
  private async computeEventUserBoard(
    eventId: Types.ObjectId
  ): Promise<ComputedBoardData> {
    // Get all challenge IDs for this event
    const event = await Event.findById(eventId)
      .select("challenges scoring.scoreboardFrozen scoring.scoreboardFrozenAt")
      .lean();

    if (!event) throw new ApiError(404, "Event not found");

    const challengeIds = event.challenges as Types.ObjectId[];
    if (challengeIds.length === 0)
      return { entries: [], totalCount: 0, isFrozen: false };

    const dateFilter: Record<string, unknown> = {
      challenge: { $in: challengeIds },
      isCorrect: true,
    };

    // If frozen, only count solves up to freeze time
    if (event.scoring.scoreboardFrozen && event.scoring.scoreboardFrozenAt) {
      dateFilter.createdAt = { $lte: event.scoring.scoreboardFrozenAt };
    }

    const rows = await Submission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$user",
          score: { $sum: "$pointsAwarded" },
          solveCount: { $sum: 1 },
          firstBloods: {
            $sum: { $cond: ["$isFirstBlood", 1, 0] },
          },
          lastSolveAt: { $max: "$createdAt" },
          teamId: { $last: "$team" },
        },
      },
      { $sort: { score: -1, lastSolveAt: 1 } as Record<string, 1 | -1> },
      { $limit: SNAPSHOT_TOP_N },
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
        $lookup: {
          from: "teams",
          localField: "teamId",
          foreignField: "_id",
          as: "team",
        },
      },
    ]);

    const totalCount = await Submission.distinct("user", dateFilter).then(
      (ids) => ids.length
    );

    const entries: ILeaderboardEntry[] = rows.map((r, i) => ({
      rank: i + 1,
      entityId: r._id,
      entityType: "user" as const,
      username: r.user.username,
      avatar: r.user.avatar,
      country: r.user.country,
      teamId: r.teamId ?? undefined,
      teamName: r.team?.[0]?.name,
      score: r.score,
      solveCount: r.solveCount,
      firstBloods: r.firstBloods,
      lastSolveAt: r.lastSolveAt,
    }));

    return {
      entries,
      totalCount,
      isFrozen: event.scoring.scoreboardFrozen,
      frozenAt: event.scoring.scoreboardFrozenAt ?? null,
    };
  }

  /**
   * Computes the leaderboard for the given event id
   * @param eventId the id of the event
   * @returns the computed leaderboard data
   * @throws {ApiError} if the event is not found
   */
  private async computeEventTeamBoard(
    eventId: Types.ObjectId
  ): Promise<ComputedBoardData> {
    const event = await Event.findById(eventId)
      .select("challenges scoring.scoreboardFrozen scoring.scoreboardFrozenAt")
      .lean();

    if (!event) throw new ApiError(404, "Event not found");

    const challengeIds = event.challenges as Types.ObjectId[];
    if (challengeIds.length === 0)
      return { entries: [], totalCount: 0, isFrozen: false };

    const dateFilter: Record<string, unknown> = {
      challenge: { $in: challengeIds },
      isCorrect: true,
      team: { $ne: null },
    };

    if (event.scoring.scoreboardFrozen && event.scoring.scoreboardFrozenAt) {
      dateFilter.createdAt = { $lte: event.scoring.scoreboardFrozenAt };
    }

    const rows = await Submission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$team",
          score: { $sum: "$pointsAwarded" },
          solveCount: { $sum: 1 },
          firstBloods: { $sum: { $cond: ["$isFirstBlood", 1, 0] } },
          lastSolveAt: { $max: "$createdAt" },
        },
      },
      { $sort: { score: -1, lastSolveAt: 1 } as Record<string, 1 | -1> },
      { $limit: SNAPSHOT_TOP_N },
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "_id",
          as: "team",
        },
      },
      { $unwind: "$team" },
    ]);

    const totalCount = await Submission.distinct("team", {
      ...dateFilter,
      team: { $ne: null },
    }).then((ids) => ids.length);

    const entries: ILeaderboardEntry[] = rows.map((r, i) => ({
      rank: i + 1,
      entityId: r._id,
      entityType: "team" as const,
      username: r.team.name,
      avatar: r.team.avatar ? { url: r.team.avatar } : undefined,
      country: r.team.country,
      score: r.score,
      solveCount: r.solveCount,
      firstBloods: r.firstBloods,
      lastSolveAt: r.lastSolveAt,
    }));

    return {
      entries,
      totalCount,
      isFrozen: event.scoring.scoreboardFrozen,
      frozenAt: event.scoring.scoreboardFrozenAt ?? null,
    };
  }

  /**
   * Compute the rank of a user outside of the snapshot leaderboard.
   * The rank is calculated by counting the number of users with a higher score.
   * @param userId The ID of the user to compute the rank for.
   * @param scope The scope of the leaderboard to compute the rank for.
   * @param eventId The ID of the event to compute the rank for, if applicable.
   * @returns The computed rank and user data, or undefined if the user does not exist.
   */
  private async getUserRankOutsideSnapshot(
    userId: Types.ObjectId,
    scope: LeaderboardScope,
    eventId?: Types.ObjectId
  ): Promise<(ILeaderboardEntry & { rank: number }) | undefined> {
    const user = await User.findById(userId)
      .select("username avatar country score teamId solvedChallenges")
      .lean();
    if (!user) return undefined;

    const usersAbove = await User.countDocuments({
      score: { $gt: user.score },
      isDeleted: false,
      isBanned: false,
    });

    return {
      rank: usersAbove + 1,
      entityId: userId,
      entityType: "user",
      username: user.username,
      avatar: user.avatar,
      country: user.country,
      score: user.score,
      solveCount: user.solvedChallenges?.length ?? 0,
      firstBloods: 0,
    };
  }
}

export const leaderboardService = new LeaderboardService();
