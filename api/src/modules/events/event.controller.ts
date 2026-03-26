import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { eventService } from "./event.service";
import {
  adminEventFiltersSchema,
  createEventSchema,
  eventFiltersSchema,
  freezeScoreboardSchema,
  leaderboardFiltersSchema,
  manageChallengesSchema,
  registerForEventSchema,
  transitionEventSchema,
  updateEventSchema,
} from "./event.validate";

const getEvents = asyncHandler(async (req, res) => {
  const filters = parseBody(eventFiltersSchema, req.query);

  const isAdmin = !!req.user && ["admin", "superadmin"].includes(req.user.role);

  const result = await eventService.getEvents(filters, isAdmin);

  return res.status(200).json(new ApiResponse(200, result, "Events retrieved"));
});

const getEventDetail = asyncHandler(async (req, res) => {
  const idOrSlug = req.params.idOrSlug as string;

  if (!idOrSlug) {
    throw new ApiError(400, "Event id or slug is required");
  }

  const isAdmin =
    !!req.user && ["admin", "superadmin"].includes(req.user!.role);

  const event = await eventService.getEventDetail(
    idOrSlug,
    req.user?._id,
    isAdmin
  );

  if (!event) {
    throw new ApiError(500, "Something went wrong while retrieving the event");
  }

  return res.status(200).json(new ApiResponse(200, event, "Event retrieved"));
});

const registerForEvent = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const { inviteCode } = parseBody(registerForEventSchema, req.body) as {
    inviteCode?: string;
  };

  await eventService.registerForEvent({
    eventId: id,
    userId: req.user!._id,
    teamId: req.user!.teamId,
    inviteCode,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully registered for the event"));
});

const getEventLeaderboard = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const { page, limit, type } = parseBody(
    leaderboardFiltersSchema,
    req.query
  ) as { page: number; limit: number; type: "user" | "team" };

  const result = await eventService.getEventLeaderboard(id, page, limit, type);

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while retrieving the leaderboard"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Leaderboard retrieved"));
});

const getEventStats = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const stats = await eventService.getEventStats(id);

  if (!stats) {
    throw new ApiError(500, "Something went wrong while retrieving the stats");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Event stats retrieved"));
});

// Admin Controllers

const adminGetEvents = asyncHandler(async (req, res) => {
  const filters = parseBody(adminEventFiltersSchema, req.query);

  const result = await eventService.getAdminEvents(filters);

  if (!result) {
    throw new ApiError(500, "Something went wrong while retrieving the events");
  }

  return res.status(200).json(new ApiResponse(200, result, "Events retrieved"));
});

const adminCreateEvent = asyncHandler(async (req, res) => {
  const data = parseBody(createEventSchema, req.body);

  const event = await eventService.createEvent({
    ...(data as Parameters<typeof eventService.createEvent>[0]),
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!event) {
    throw new ApiError(500, "Something went wrong while creating the event");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, event, "Event created successfully"));
});

const adminUpdateEvent = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const data = parseBody(updateEventSchema, req.body);

  const event = await eventService.updateEvent({
    ...(data as Parameters<typeof eventService.updateEvent>[0]),
    eventId: id,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!event) {
    throw new ApiError(500, "Something went wrong while updating the event");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event updated successfully"));
});

/**
 * POST /admin/events/:id/transition
 * Move event to a new status, enforcing the forward-only transition graph.
 * Body: { status: "draft" | "scheduled" | "active" | "paused" | "ended" | "archived" }
 */
const adminTransitionEvent = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const { status } = parseBody(transitionEventSchema, req.body) as {
    status: Parameters<typeof eventService.transitionEvent>[0]["newStatus"];
  };

  const event = await eventService.transitionEvent({
    eventId: id,
    newStatus: status,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!event) {
    throw new ApiError(
      500,
      "Something went wrong while transitioning the event"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, `Event transitioned to "${status}"`));
});

const adminFreezeScoreboard = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const { frozen } = parseBody(freezeScoreboardSchema, req.body) as {
    frozen: boolean;
  };

  const event = await eventService.freezeScoreboard({
    eventId: id,
    frozen,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!event) {
    throw new ApiError(
      500,
      "Something went wrong while freezing the scoreboard"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        event,
        frozen ? "Scoreboard frozen" : "Scoreboard unfrozen"
      )
    );
});

const adminAddChallenges = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const { challengeIds } = parseBody(manageChallengesSchema, req.body) as {
    challengeIds: string[];
  };

  const event = await eventService.addChallenges({
    eventId: id,
    challengeIds,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!event) {
    throw new ApiError(
      500,
      "Something went wrong while adding challenges to the event"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        event,
        `${challengeIds.length} challenge(s) added to event`
      )
    );
});

const adminRemoveChallenges = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  const { challengeIds } = parseBody(manageChallengesSchema, req.body) as {
    challengeIds: string[];
  };

  const event = await eventService.removeChallenges({
    eventId: id,
    challengeIds,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!event) {
    throw new ApiError(
      500,
      "Something went wrong while removing challenges from the event"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Challenges removed from event"));
});

const adminDeleteEvent = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Event id is required");
  }

  await eventService.deleteEvent(id, req.user!._id, req.user!.username);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Event deleted successfully"));
});

const adminRunAutoTransitions = asyncHandler(async (_req, res) => {
  const result = await eventService.runAutoTransitions();

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while running auto-transitions"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Auto-transitions complete — ${result.activated.length} activated, ${result.ended.length} ended`
      )
    );
});

export {
  getEvents,
  getEventDetail,
  registerForEvent,
  getEventLeaderboard,
  getEventStats,
  adminGetEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminTransitionEvent,
  adminFreezeScoreboard,
  adminAddChallenges,
  adminRemoveChallenges,
  adminDeleteEvent,
  adminRunAutoTransitions,
};
