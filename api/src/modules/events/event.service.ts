import escapeStringRegexp from "escape-string-regexp";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import logger from "../../utils/logger";
import {
  AdminEventFilters,
  CreateEventPayload,
  EventFilters,
  EventLeaderboardResult,
  EventStats,
  FreezeScoreboardPayload,
  ManageChallengesPayload,
  RegisterForEventPayload,
  TransitionEventPayload,
  UpdateEventPayload,
} from "./event.types";
import Event, {
  EventStatus,
  IEvent,
  IEventModel,
} from "../../models/event.model";
import { buildMeta } from "../../utils/helpers";
import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import Submission from "../../models/submission.model";
import Team from "../../models/team.model";
import Challenge from "../../models/challenge.model";
import { leaderboardService } from "../leaderboard/leaderboard.service";

/**
 * Write an audit log entry.
 *
 * @param {Parameters<IAuditLogModel["record"]>[0]} entry - The audit log entry to write.
 *
 * @returns {Promise<void>} A promise that resolves when the audit log entry has been written.
 * @throws Will log an error if the audit log write fails.
 */
const audit = async (
  entry: Parameters<IAuditLogModel["record"]>[0]
): Promise<void> => {
  try {
    await (AuditLog as unknown as IAuditLogModel).record(entry);
  } catch (err) {
    logger.error("[EventService] Audit log write failed", err);
  }
};

// Service

class EventService {
  // Public Player Operations

  /**
   * Get a list of events filtered by the provided options.
   *
   * @param {EventFilters} filters - The filters to apply to the event list.
   * @param {boolean} [isAdmin=false] - Whether to apply admin-only filters to the event list.
   * @returns {Promise<{events: IEvent[], meta: IMeta}>} A promise that resolves to an object containing the list of events and pagination metadata.
   */
  async getEvents(filters: EventFilters, isAdmin = false) {
    const {
      page,
      limit,
      status,
      format,
      visibility,
      search,
      sortBy,
      sortOrder,
    } = filters;

    const query: Record<string, unknown> = {};

    if (!isAdmin) {
      // Players only see non-draft, non-archived events
      query.status = status ?? { $in: ["scheduled", "active", "ended"] };
      query.visibility = { $in: ["public"] };
    } else {
      if (status) query.status = status;
      if (visibility) query.visibility = visibility;
    }

    if (format) query.format = format;

    if (search) {
      query.$or = [
        { name: { $regex: escapeStringRegexp(search), $options: "i" } },
        {
          "branding.tagline": {
            $regex: escapeStringRegexp(search),
            $options: "i",
          },
        },
      ];
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy === "registeredCount" ? "stats.registeredCount" : sortBy]:
        sortOrder === "asc" ? 1 : -1,
    };

    const [events, total] = await Promise.all([
      Event.find(query)
        .select(
          "name slug format status visibility opensAt closedAt branding.tagline branding.bannerUrl branding.accentColor scoring.scoreboardFrozen stats autoTransition"
        )
        .populate("organizers", "username avatar")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return { events, meta: buildMeta(page, limit, total) };
  }

  /**
   * Retrieve an event by id or slug.
   * @param idOrSlug - Event id or slug
   * @param userId - User id (optional)
   * @param isAdmin - If true, ignore "draft" and "archived" event status
   * @returns Event object with additional fields:
   *  - isOrganizer: boolean indicating if the user is an organizer
   *  - isRegistered: boolean indicating if the user (or their team) is registered for the event
   *  - registration.inviteCode: string containing the invite code, only exposed if the user is an organizer or an admin
   */
  async getEventDetail(
    idOrSlug: string,
    userId?: Types.ObjectId,
    isAdmin = false
  ) {
    const query: Record<string, unknown> = Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    if (!isAdmin) {
      query.status = { $nin: ["draft", "archived"] };
    }

    const event = await Event.findOne(query)
      .populate("organizers", "username avatar email")
      .populate(
        "challenges",
        "title slug category difficulty points solveCount isVisible"
      )
      .lean();

    if (!event) throw new ApiError(404, "Event not found");

    let isOrganizer = false;
    let isRegistered = false;

    if (userId) {
      isOrganizer = event.organizers.some(
        (o: { _id: Types.ObjectId }) => o._id.toString() === userId.toString()
      );

      // Check if user (or their team) is registered — via solved challenges in this event
      // Simple proxy: user has at least one correct submission for an event challenge
      if (event.challenges.length > 0) {
        const challengeIds = event.challenges.map(
          (c: { _id: Types.ObjectId }) => c._id
        );
        const participated = await Submission.exists({
          user: userId,
          challenge: { $in: challengeIds },
          isCorrect: true,
        });
        isRegistered = !!participated;
      }
    }

    return {
      ...event,
      isOrganizer,
      isRegistered,
      // Never expose invite code to non-organizers / non-admins
      registration: {
        ...event.registration,
        inviteCode:
          isOrganizer || isAdmin ? event.registration?.inviteCode : undefined,
      },
    };
  }

  /**
   * Register for an event.
   * @param payload - Event id, user id, team id (optional), and invite code (optional)
   * @returns Event object after registration
   * @throws {ApiError} - If the event is not found, if the event is not in the scheduled or active state, if registration is closed, if the event has reached maximum participant capacity, if the invite code is invalid or missing, if the user is not on the allowed list for an internal event, if the team size exceeds the maximum allowed size, or if solo participation is not allowed.
   */
  async registerForEvent(payload: RegisterForEventPayload): Promise<IEvent> {
    const { eventId, userId, teamId, inviteCode } = payload;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (!["scheduled", "active"].includes(event.status)) {
      throw new ApiError(
        400,
        `Cannot register for an event with status "${event.status}". Registration is only open for scheduled or active events.`
      );
    }

    if (!event.registration.isOpen) {
      throw new ApiError(
        400,
        "Registration for this event is currently closed"
      );
    }

    if (
      event.registration.registrationClosesAt &&
      event.registration.registrationClosesAt < new Date()
    ) {
      throw new ApiError(
        400,
        "The registration deadline for this event has passed"
      );
    }

    if (
      event.registration.maxParticipants > 0 &&
      event.stats.registeredCount >= event.registration.maxParticipants
    ) {
      throw new ApiError(
        400,
        "This event has reached its maximum participant capacity"
      );
    }

    // Visibility checks
    if (event.visibility === "invite") {
      if (!inviteCode) {
        throw new ApiError(
          400,
          "An invite code is required to register for this event"
        );
      }
      if (inviteCode !== event.registration.inviteCode) {
        throw new ApiError(400, "Invalid invite code");
      }
    }

    if (event.visibility === "internal") {
      const userAllowed = event.registration.allowedUsers.some(
        (id) => id.toString() === userId.toString()
      );
      const teamAllowed =
        teamId &&
        event.registration.allowedTeams.some(
          (id) => id.toString() === teamId.toString()
        );

      if (!userAllowed && !teamAllowed) {
        throw new ApiError(
          409,
          "You are not on the allowed list for this internal event"
        );
      }
    }

    // Team size check
    if (teamId && event.registration.maxTeamSize > 0) {
      const team = await Team.findById(teamId).select("members").lean();
      if (team && team.members.length > event.registration.maxTeamSize) {
        throw new ApiError(
          400,
          `Your team has ${team.members.length} members but this event's maximum team size is ${event.registration.maxTeamSize}`
        );
      }
    }

    // Solo check
    if (!event.registration.allowSolo && !teamId) {
      throw new ApiError(
        400,
        "This event requires you to be in a team. Solo participation is not allowed."
      );
    }

    // Increment registered count
    await (Event as unknown as IEventModel).incrementStat(
      event._id as Types.ObjectId,
      "registeredCount",
      1
    );

    if (teamId) {
      await (Event as unknown as IEventModel).incrementStat(
        event._id as Types.ObjectId,
        "teamCount",
        1
      );
    }

    return event;
  }

  // Leaderboard

  /**
   * Retrieve the leaderboard for an event.
   *
   * @param {string} eventId - The ID of the event
   * @param {number} [page=1] - The page number to retrieve
   * @param {number} [limit=50] - The number of entries to retrieve per page
   * @param {"user" | "team"} [type="user"] - The type of leaderboard to retrieve
   * @returns {Promise<EventLeaderboardResult>}
   */
  async getEventLeaderboard(
    eventId: string,
    page = 1,
    limit = 50,
    type: "user" | "team" = "user"
  ): Promise<EventLeaderboardResult> {
    const event = await Event.findById(eventId)
      .select(
        "name status scoring.scoreboardFrozen scoring.scoreboardFrozenAt challenges"
      )
      .lean();

    if (!event) throw new ApiError(400, "Event not found");

    if (["draft", "archived"].includes(event.status)) {
      throw new ApiError(400, "Leaderboard is not available for this event");
    }

    const challengeIds = event.challenges as Types.ObjectId[];
    if (challengeIds.length === 0) {
      return {
        eventId,
        eventName: event.name,
        isScoreboardFrozen: event.scoring.scoreboardFrozen,
        frozenAt: event.scoring.scoreboardFrozenAt,
        entries: [],
        total: 0,
        page,
        limit,
      };
    }

    // When frozen — only count submissions up to the freeze timestamp
    const submissionDateFilter: Record<string, unknown> = {
      challenge: { $in: challengeIds },
      isCorrect: true,
    };

    if (event.scoring.scoreboardFrozen && event.scoring.scoreboardFrozenAt) {
      submissionDateFilter.createdAt = {
        $lte: event.scoring.scoreboardFrozenAt,
      };
    }

    if (type === "user") {
      const result = await leaderboardService.getLeaderboard({
        scope: type === "user" ? "event_user" : "event_team",
        eventId,
        page,
        limit,
      });

      return {
        eventId,
        eventName: event.name,
        isScoreboardFrozen: event.scoring.scoreboardFrozen,
        frozenAt: event.scoring.scoreboardFrozenAt,
        entries: result.entries.map((e, i) => ({
          rank: (page - 1) * limit + i + 1,

          userId: e.entityType === "user" ? e.entityId.toString() : "",
          username: e.username,
          avatar: e.avatar,
          country: e.country,

          teamId: e.teamId?.toString(),
          teamName: e.teamName,

          score: e.score,
          solveCount: e.solveCount,
          lastSolveAt: e.lastSolveAt,
        })),
        total: result.meta.total,
        page,
        limit,
      };
    }

    // Team leaderboard
    const teamPipeline = [
      { $match: { ...submissionDateFilter, team: { $ne: null } } },
      {
        $group: {
          _id: "$team",
          totalPoints: { $sum: "$pointsAwarded" },
          solveCount: { $sum: 1 },
          lastSolveAt: { $max: "$createdAt" },
        },
      },
      { $sort: { totalPoints: -1, lastSolveAt: 1 } as Record<string, 1 | -1> },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "_id",
          as: "team",
        },
      },
      { $unwind: "$team" },
      {
        $project: {
          teamId: "$_id",
          teamName: "$team.name",
          avatar: "$team.avatar",
          country: "$team.country",
          totalPoints: 1,
          solveCount: 1,
          lastSolveAt: 1,
        },
      },
    ];

    const result = await leaderboardService.getLeaderboard({
      scope: "event_team",
      eventId,
      page,
      limit,
    });

    return {
      eventId,
      eventName: event.name,
      isScoreboardFrozen: event.scoring.scoreboardFrozen,
      frozenAt: event.scoring.scoreboardFrozenAt,
      entries: result.entries.map((e, i) => ({
        rank: (page - 1) * limit + i + 1,
        userId: "",
        username: e?.teamName || "",
        avatar: e.avatar,
        country: e.country,
        teamId: e?.teamId?.toString() || "",
        teamName: e.teamName,
        score: e.score,
        solveCount: e.solveCount,
        lastSolveAt: e.lastSolveAt,
      })),
      total: result.meta.total,
      page,
      limit,
    };
  }

  /**
   * Returns the event stats for a given event
   * @param {string} eventId - the event id
   * @returns {Promise<EventStats>} - a promise that resolves to an object containing event stats
   */
  async getEventStats(eventId: string): Promise<EventStats> {
    const event = await Event.findById(eventId)
      .select("stats challenges")
      .lean();

    if (!event) throw new ApiError(404, "Event not found");

    const challengeIds = event.challenges as Types.ObjectId[];

    if (challengeIds.length === 0) {
      return {
        registeredCount: event.stats.registeredCount,
        teamCount: event.stats.teamCount,
        totalSolves: 0,
        totalAttempts: 0,
        solveRate: 0,
        firstBloods: 0,
        topChallenge: undefined,
        hardestChallenge: undefined,
        solvesByCategory: [],
        activityByHour: [],
      };
    }

    const baseMatch = { challenge: { $in: challengeIds } };

    const [submissionTotals, challengeBreakdown, activityByHour, firstBloods] =
      await Promise.all([
        // totals
        Submission.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
          },
        ]),

        // per-challenge breakdown for category stats + top/hardest
        Submission.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: "$challenge",
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
              attempts: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "challenges",
              localField: "_id",
              foreignField: "_id",
              as: "challenge",
            },
          },
          { $unwind: "$challenge" },
          {
            $project: {
              title: "$challenge.title",
              category: "$challenge.category",
              correct: 1,
              attempts: 1,
              solveRate: {
                $cond: [
                  { $gt: ["$attempts", 0] },
                  { $divide: ["$correct", "$attempts"] },
                  0,
                ],
              },
            },
          },
        ]),

        // hourly activity
        Submission.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%dT%H:00:00.000Z",
                  date: "$createdAt",
                },
              },
              submissions: { $sum: 1 },
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
          },
          { $sort: { _id: 1 } as Record<string, 1 | -1> },
          { $project: { hour: "$_id", submissions: 1, correct: 1, _id: 0 } },
        ]),

        Submission.countDocuments({ ...baseMatch, isFirstBlood: true }),
      ]);

    const t = submissionTotals[0] ?? { total: 0, correct: 0 };
    const solveRate =
      t.total > 0 ? Math.round((t.correct / t.total) * 100 * 100) / 100 : 0;

    // Top challenge (most solves)
    const sorted = [...challengeBreakdown].sort(
      (a, b) => b.correct - a.correct
    );
    const topChallenge = sorted[0]
      ? {
          _id: sorted[0]._id.toString(),
          title: sorted[0].title,
          solveCount: sorted[0].correct,
        }
      : undefined;

    // Hardest challenge (lowest solve rate, minimum 5 attempts)
    const hardest = challengeBreakdown
      .filter((c) => c.attempts >= 5)
      .sort((a, b) => a.solveRate - b.solveRate)[0];

    const hardestChallenge = hardest
      ? {
          _id: hardest._id.toString(),
          title: hardest.title,
          solveCount: hardest.correct,
          attempts: hardest.attempts,
          solveRate: Math.round(hardest.solveRate * 100 * 100) / 100,
        }
      : undefined;

    // Group by category
    const categoryMap = new Map<string, { solves: number; attempts: number }>();
    for (const c of challengeBreakdown) {
      const cat = c.category as string;
      const existing = categoryMap.get(cat) ?? { solves: 0, attempts: 0 };
      categoryMap.set(cat, {
        solves: existing.solves + c.correct,
        attempts: existing.attempts + c.attempts,
      });
    }

    const solvesByCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({ category, ...data })
    );

    return {
      registeredCount: event.stats.registeredCount,
      teamCount: event.stats.teamCount,
      totalSolves: t.correct,
      totalAttempts: t.total,
      solveRate,
      firstBloods,
      topChallenge,
      hardestChallenge,
      solvesByCategory,
      activityByHour,
    };
  }

  // Admin: CRUD

  /**
   * Create a new event.
   * @param {CreateEventPayload} payload - Contains information about the event to be created.
   * @returns {Promise<IEvent>} - The newly created event.
   * @throws {ApiError} - If the event already exists with the same name, or if the inviteCode is missing when visibility is "invite".
   */
  async createEvent(payload: CreateEventPayload): Promise<IEvent> {
    const {
      requesterId,
      requesterUsername,
      organizerIds,
      challengeIds,
      ...rest
    } = payload;

    const exists = await Event.findOne({
      name: {
        $regex: new RegExp(`^${escapeStringRegexp(rest.name)}$`, "i"),
      },
    }).lean();

    if (exists)
      throw new ApiError(409, "An event with this name already exists");

    if (rest.visibility === "invite" && !rest.registration?.inviteCode) {
      throw new ApiError(
        400,
        "An inviteCode is required when visibility is 'invite'"
      );
    }

    // Validate challengeIds exist
    if (challengeIds?.length) {
      const found = await Challenge.countDocuments({
        _id: { $in: challengeIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      });
      if (found !== challengeIds.length) {
        throw new ApiError(
          400,
          "One or more challengeIds do not exist or are inactive"
        );
      }
    }

    const organizers = organizerIds?.length
      ? organizerIds.map((id) => new Types.ObjectId(id))
      : [requesterId];

    const event = await Event.create({
      ...rest,
      organizers,
      challenges: challengeIds?.map((id) => new Types.ObjectId(id)) ?? [],
      ...(rest.registration && {
        registration: {
          ...rest.registration,
          allowedUsers:
            rest.registration.allowedUsers?.map(
              (id) => new Types.ObjectId(id)
            ) ?? [],
          allowedTeams:
            rest.registration.allowedTeams?.map(
              (id) => new Types.ObjectId(id)
            ) ?? [],
        },
      }),
    });

    await audit({
      action: "admin:event_start",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: event._id as Types.ObjectId,
        collection: "Event",
        label: event.name,
      },
      metadata: { format: event.format, visibility: event.visibility },
    });

    return event;
  }

  /**
   * Update an existing event.
   *
   * @throws {ApiError} 404 if event does not exist
   * @throws {ApiError} 409 if event is "ended" or "archived" and cannot be modified
   * @throws {ApiError} 409 if event name already in use
   * @throws {ApiError} 400 if closedAt is not after opensAt
   * @throws {ApiError} 400 if one or more challengeIds do not exist or are inactive
   * @throws {ApiError} 400 if an event has no organizers
   */
  async updateEvent(payload: UpdateEventPayload): Promise<IEvent> {
    const {
      eventId,
      requesterId,
      requesterUsername,
      organizerIds,
      challengeIds,
      ...rest
    } = payload;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (["ended", "archived"].includes(event.status)) {
      throw new ApiError(
        409,
        `Event is "${event.status}" and can no longer be modified`
      );
    }

    if (rest.name && rest.name !== event.name) {
      const dup = await Event.findOne({
        name: {
          $regex: new RegExp(`^${escapeStringRegexp(rest.name)}$`, "i"),
        },
        _id: { $ne: eventId },
      }).lean();
      if (dup) throw new ApiError(409, "Event name already in use");
    }

    // Date integrity check when only one date is being updated
    const newOpensAt = rest.opensAt ?? event.opensAt;
    const newClosedAt = rest.closedAt ?? event.closedAt;
    if (newOpensAt >= newClosedAt) {
      throw new ApiError(400, "closedAt must be after opensAt");
    }

    if (challengeIds) {
      const found = await Challenge.countDocuments({
        _id: { $in: challengeIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      });
      if (found !== challengeIds.length) {
        throw new ApiError(
          400,
          "One or more challengeIds do not exist or are inactive"
        );
      }
      event.challenges = challengeIds.map(
        (id) => new Types.ObjectId(id)
      ) as unknown as typeof event.challenges;
    }

    if (organizerIds) {
      if (organizerIds.length === 0) {
        throw new ApiError(400, "An event must have at least one organizer");
      }
      event.organizers = organizerIds.map(
        (id) => new Types.ObjectId(id)
      ) as unknown as typeof event.organizers;
    }

    // Deep merge nested sub-documents
    if (rest.scoring) Object.assign(event.scoring, rest.scoring);
    if (rest.branding) Object.assign(event.branding, rest.branding);
    if (rest.registration) {
      const reg = rest.registration;
      Object.assign(event.registration, {
        ...reg,
        ...(reg.allowedUsers && {
          allowedUsers: reg.allowedUsers.map((id) => new Types.ObjectId(id)),
        }),
        ...(reg.allowedTeams && {
          allowedTeams: reg.allowedTeams.map((id) => new Types.ObjectId(id)),
        }),
      });
    }

    const scalarFields = [
      "name",
      "format",
      "visibility",
      "opensAt",
      "closedAt",
      "autoTransition",
    ] as const;

    for (const field of scalarFields) {
      const val = rest[field as keyof typeof rest];
      if (val !== undefined) {
        (event as unknown as Record<string, unknown>)[field] = val;
      }
    }

    await event.save();

    await audit({
      action: "admin:settings_update",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: event._id as Types.ObjectId,
        collection: "Event",
        label: event.name,
      },
    });

    return event;
  }

  /**
   * Transitions an event from one status to another.
   * Enforces the transition graph specified in the Event model.
   * Throws an ApiError if the transition is invalid (e.g. cannot activate an event with no challenges).
   * Throws an ApiError if the transition would result in an invalid state (e.g. cannot schedule an event whose opensAt is in the past).
   * @param {TransitionEventPayload} payload - Event ID, new status, and requesting user's ID and username.
   * @returns {Promise<IEvent>} - The updated event document.
   * @throws {ApiError} - If the transition is invalid or would result in an invalid state.
   */
  async transitionEvent(payload: TransitionEventPayload): Promise<IEvent> {
    const { eventId, newStatus, requesterId, requesterUsername } = payload;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    // Pre-transition guards
    if (newStatus === "active" && event.challenges.length === 0) {
      throw new ApiError(
        400,
        "Cannot activate an event with no challenges. Add at least one challenge first."
      );
    }

    if (newStatus === "scheduled" && event.opensAt <= new Date()) {
      throw new ApiError(
        400,
        "Cannot schedule an event whose opensAt is in the past. Update the date first."
      );
    }

    // Delegates to model method which enforces the transition graph
    await event.transitionTo(newStatus, requesterId);

    const actionMap: Record<EventStatus, string> = {
      active: "admin:event_start",
      ended: "admin:event_end",
      scheduled: "admin:settings_update",
      draft: "admin:settings_update",
      paused: "admin:settings_update",
      archived: "admin:settings_update",
    };

    await audit({
      action: actionMap[newStatus] as Parameters<
        IAuditLogModel["record"]
      >[0]["action"],
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: event._id as Types.ObjectId,
        collection: "Event",
        label: event.name,
      },
      metadata: { previousStatus: event.status, newStatus },
    });

    return event;
  }

  /**
   * Freeze or unfreeze the scoreboard for an event.
   * Only active events can be frozen.
   * Throws an ApiError if the event is not found.
   * @param {FreezeScoreboardPayload} payload - Event ID, whether to freeze (true) or unfreeze (false), and the requesting user's ID and username.
   * @returns {Promise<IEvent>} - The updated event document.
   * @throws {ApiError} - If the event is not found or if the scoreboard cannot be frozen/unfrozen.
   */
  async freezeScoreboard(payload: FreezeScoreboardPayload): Promise<IEvent> {
    const { eventId, frozen, requesterId, requesterUsername } = payload;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    // Delegate to model — it enforces active-only constraint
    await event.setScoreboardFrozen(frozen);

    await leaderboardService.setFrozen(event._id as Types.ObjectId, frozen);

    await audit({
      action: frozen ? "admin:scoreboard_freeze" : "admin:scoreboard_unfreeze",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: event._id as Types.ObjectId,
        collection: "Event",
        label: event.name,
      },
    });

    return event;
  }

  /**
   * Add challenges to an event.
   * Throws 404 if the event is not found.
   * Throws 409 if the event is ended or archived.
   * Throws 400 if any of the provided challenges are not active or do not exist,
   *  or if all provided challenges are already in this event.
   * @param {ManageChallengesPayload} payload - The payload containing the event ID, challenge IDs, and requester details.
   * @returns {Promise<IEvent>} - A promise which resolves to the updated event document.
   */
  async addChallenges(payload: ManageChallengesPayload): Promise<IEvent> {
    const { eventId, challengeIds, requesterId, requesterUsername } = payload;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (["ended", "archived"].includes(event.status)) {
      throw new ApiError(
        409,
        "Cannot modify challenges on an ended or archived event"
      );
    }

    // Validate all challenges exist and are active
    const found = await Challenge.countDocuments({
      _id: { $in: challengeIds.map((id) => new Types.ObjectId(id)) },
      isActive: true,
    });

    if (found !== challengeIds.length) {
      throw new ApiError(
        400,
        "One or more challengeIds do not exist or are not active"
      );
    }

    // Add without duplicates
    const existing = new Set(event.challenges.map((id) => id.toString()));

    const toAdd = challengeIds
      .filter((id) => !existing.has(id))
      .map((id) => new Types.ObjectId(id));

    if (toAdd.length === 0) {
      throw new ApiError(
        409,
        "All provided challenges are already in this event"
      );
    }

    event.challenges.push(...(toAdd as unknown as typeof event.challenges));
    await event.save({ validateBeforeSave: false });

    await audit({
      action: "admin:settings_update",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: event._id as Types.ObjectId,
        collection: "Event",
        label: event.name,
      },
      metadata: { action: "challenges_added", addedCount: toAdd.length },
    });

    return event;
  }

  /**
   * Remove challenges from an event.
   * Throws 404 if the event is not found.
   * Throws 409 if the event is ended or archived.
   * Throws 400 if none of the provided challenges are in this event.
   * @param {ManageChallengesPayload} payload - The payload containing the event ID, challenge IDs, and requester details.
   * @returns {Promise<IEvent>} - A promise which resolves to the updated event document.
   */
  async removeChallenges(payload: ManageChallengesPayload): Promise<IEvent> {
    const { eventId, challengeIds, requesterId, requesterUsername } = payload;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (["ended", "archived"].includes(event.status)) {
      throw new ApiError(
        409,
        "Cannot modify challenges on an ended or archived event"
      );
    }

    const removeSet = new Set(challengeIds);
    const before = event.challenges.length;

    event.challenges = event.challenges.filter(
      (id) => !removeSet.has(id.toString())
    ) as typeof event.challenges;

    const removedCount = before - event.challenges.length;

    if (removedCount === 0) {
      throw new ApiError(
        400,
        "None of the provided challenges are in this event"
      );
    }

    await event.save({ validateBeforeSave: false });

    await audit({
      action: "admin:settings_update",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: event._id as Types.ObjectId,
        collection: "Event",
        label: event.name,
      },
      metadata: { action: "challenges_removed", removedCount },
    });

    return event;
  }

  /**
   * Deletes an event.
   * Throws 404 if the event is not found.
   * Throws 409 if the event is active. End the event first, then delete.
   * @param {string} eventId - The id of the event to delete.
   * @param {Types.ObjectId} requesterId - The id of the user performing the action.
   * @param {string} requesterUsername - The username of the user performing the action.
   * @returns {Promise<void>} - A promise which resolves when the event has been deleted.
   */
  async deleteEvent(
    eventId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (event.status === "active") {
      throw new ApiError(
        409,
        "Cannot delete an active event. End the event first, then delete."
      );
    }

    await Event.findByIdAndDelete(eventId);

    await audit({
      action: "admin:event_end",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: new Types.ObjectId(eventId),
        collection: "Event",
        label: event.name,
      },
      metadata: { action: "event_deleted", previousStatus: event.status },
    });
  }

  /**
   * Retrieves a list of events which match the provided filters.
   * @param {AdminEventFilters} filters - Filters to apply to the query.
   * @returns A promise which resolves to an object containing the list of events and metadata about the query.
   */
  async getAdminEvents(filters: AdminEventFilters) {
    const {
      page,
      limit,
      status,
      format,
      visibility,
      search,
      sortBy,
      sortOrder,
      organizerId,
      autoTransition,
    } = filters;

    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (format) query.format = format;
    if (visibility) query.visibility = visibility;
    if (organizerId) query.organizers = new Types.ObjectId(organizerId);
    if (autoTransition !== undefined) query.autoTransition = autoTransition;

    if (search) {
      query.$or = [
        { name: { $regex: escapeStringRegexp(search), $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy === "registeredCount" ? "stats.registeredCount" : sortBy]:
        sortOrder === "asc" ? 1 : -1,
    };

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate("organizers", "username avatar email")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return { events, meta: buildMeta(page, limit, total) };
  }

  /**
   * Runs all pending auto-transitions in the database.
   *
   * Will auto-activate events whose opensAt is in the past,
   * and auto-end events whose closedAt is in the past.
   *
   * Returns an object containing two arrays: activated and ended.
   * The activated array contains the IDs of events that were auto-activated,
   * and the ended array contains the IDs of events that were auto-ended.
   */
  async runAutoTransitions(): Promise<{
    activated: string[];
    ended: string[];
  }> {
    const pending = await (
      Event as unknown as IEventModel
    ).getPendingAutoTransitions();

    const activated: string[] = [];
    const ended: string[] = [];

    for (const eventDoc of pending) {
      const event = await Event.findById(eventDoc._id);
      if (!event) continue;

      try {
        if (event.status === "scheduled" && event.opensAt <= new Date()) {
          await event.transitionTo("active");
          activated.push(event._id.toString());
          logger.info(
            `[EventService] Auto-activated event "${event.name}" (${event._id})`
          );
        } else if (event.status === "active" && event.closedAt <= new Date()) {
          await event.transitionTo("ended");
          ended.push(event._id.toString());
          logger.info(
            `[EventService] Auto-ended event "${event.name}" (${event._id})`
          );
        }
      } catch (err) {
        logger.error(
          `[EventService] Auto-transition failed for event "${event.name}": ${(err as Error).message}`
        );
      }
    }

    return { activated, ended };
  }
}

export const eventService = new EventService();
