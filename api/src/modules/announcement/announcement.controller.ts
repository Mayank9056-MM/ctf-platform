import Announcement from "../../models/anouncement.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { announcementService } from "./announcement.service";
import {
  adminAnnouncementFiltersSchema,
  createAnnouncementSchema,
  feedFiltersSchema,
  retractAnnouncementSchema,
  updateAnnouncementSchema,
} from "./announcement.validate";

/**
 * GET /announcements
 * Participant-facing announcement feed.
 * Applies audience filter, expiry, and dismiss exclusion automatically.
 * Optional auth: anonymous users see "all" audience announcements only.
 * Query: severity?, challengeId?, page, limit
 */
const getFeed = asyncHandler(async (req, res) => {
  const filters = parseBody(feedFiltersSchema, req.query);

  // Anonymous users: show "all" audience announcements (no personalisation)
  const userId = req.user?._id ?? null;
  const hasTeam = !!req.user?.teamId;

  if (!userId) {
    // Unauthenticated — return only "all" audience announcements
    const query: Record<string, unknown> = {
      isPublished: true,
      isRetracted: false,
      audience: "all",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    if (filters.severity) query.severity = filters.severity;

    const announcements = await Announcement.find(query)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean();

    if (!announcements) {
      throw new ApiError(404, "Announcements not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { announcements, meta: { page: filters.page, limit: filters.limit } },
          "Announcements retrieved"
        )
      );
  }

  const result = await announcementService.getFeed(userId, hasTeam, filters);

  if (!result) {
    throw new ApiError(500, "Something went wrong while getting announcements");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Announcements retrieved"));
});

/**
 * GET /announcements/challenge/:challengeId
 * Active announcements scoped to a specific challenge.
 * Used on the challenge detail page.
 */
const getChallengeAnnouncements = asyncHandler(async (req, res) => {
  const challengeId = req.params.challengeId as string;

  if (!challengeId) {
    throw new ApiError(404, "Challenge not found");
  }

  const announcements =
    await announcementService.getChallengeAnnouncements(challengeId);

  if (!announcements) {
    throw new ApiError(500, "Something went wrong while getting announcements");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, announcements, "Challenge announcements retrieved")
    );
});

/**
 * POST /announcements/:id/dismiss
 * Player dismisses an announcement so it no longer shows in their feed.
 * Auth required.
 */
const dismissAnnouncement = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Id missing!");
  }

  await announcementService.dismissAnnouncement(id, req.user!._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Announcement dismissed"));
});

// Admin Controllers

/**
 * GET /announcements/admin
 * Admin list — all statuses (draft, published, retracted).
 * Query: isPublished, isRetracted, severity, audience, authorId, challengeId,
 *        search, from, to, sortBy, sortOrder, page, limit
 */
const adminGetAnnouncements = asyncHandler(async (req, res) => {
  const filters = parseBody(adminAnnouncementFiltersSchema, req.query);

  const result = await announcementService.getAdminAnnouncements(filters);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Announcements retrieved"));
});

/**
 * GET /announcements/admin/stats
 * Aggregate stats for the admin dashboard panel.
 */
const adminGetStats = asyncHandler(async (_req, res) => {
  const stats = await announcementService.getAdminStats();

  if (!stats) {
    throw new ApiError(500, "Something went wrong while fetching admin stats");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Announcement stats retrieved"));
});

/**
 * GET /announcements/admin/:id
 * Full announcement detail — admin view (no audience filtering).
 */
const adminGetById = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Id missing!");
  }

  const announcement = await announcementService.getAdminAnnouncementById(id);

  if (!announcement) {
    throw new ApiError(
      500,
      "Something went wrong while getting the annoucement"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, announcement, "Announcement retrieved"));
});

/**
 * POST /announcements/admin
 * Create a new announcement.
 * Use publishImmediately: true to publish and dispatch notifications in one call.
 * Body: { title, body, severity?, audience?, targetUsers?, challengeId?,
 *         actionUrl?, actionLabel?, expiresAt?, publishImmediately? }
 */
const adminCreate = asyncHandler(async (req, res) => {
  const data = parseBody(createAnnouncementSchema, req.body) as Parameters<
    typeof announcementService.createAnnouncement
  >[0];

  const announcement = await announcementService.createAnnouncement({
    ...data,
    authorId: req.user!._id,
    authorUsername: req.user!.username,
  });

  if (!announcement) {
    throw new ApiError(500, "Something went wrong while creating annoucement");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        announcement,
        announcement.isPublished
          ? "Announcement created and published"
          : "Announcement saved as draft"
      )
    );
});

/**
 * PATCH /announcements/admin/:id
 * Update a draft or published announcement.
 * Cannot edit retracted announcements.
 */
const adminUpdate = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Id missing!");
  }

  const data = parseBody(updateAnnouncementSchema, req.body);

  const announcement = await announcementService.updateAnnouncement({
    ...(data as Parameters<typeof announcementService.updateAnnouncement>[0]),
    announcementId: id,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!announcement) {
    throw new ApiError(500, "Something went wrong while updating annoucemnt");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, announcement, "Announcement updated"));
});

/**
 * POST /announcements/admin/:id/publish
 * Publish a draft announcement.
 * Idempotent on already-published announcements (no re-notification).
 * Dispatches in-app notifications to the audience on first publish.
 */
const adminPublish = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Id missing!");
  }

  const announcement = await announcementService.publishAnnouncement(
    id,
    req.user!._id,
    req.user!.username
  );

  if (!announcement) {
    throw new ApiError(
      500,
      "Something went wrong while publishing announcement"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, announcement, "Announcement published"));
});

/**
 * POST /announcements/admin/:id/retract
 * Retract a published announcement — hides it from the feed.
 * Body: { reason?: string }
 * Retracted announcements cannot be edited or re-published.
 */
const adminRetract = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Id missing!");
  }

  const { reason } = parseBody(retractAnnouncementSchema, req.body) as {
    reason?: string;
  };

  const announcement = await announcementService.retractAnnouncement({
    announcementId: id,
    reason,
    requesterId: req.user!._id,
    requesterUsername: req.user!.username,
  });

  if (!announcement) {
    throw new ApiError(
      500,
      "Something went wrong while retracting annoucement"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, announcement, "Announcement retracted"));
});

/**
 * DELETE /announcements/admin/:id
 * Hard-delete. For GDPR / content removal only.
 * Prefer retract for routine operations — this is irreversible.
 * Superadmin only.
 */
const adminDelete = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Id missing!");
  }

  await announcementService.deleteAnnouncement(
    id,
    req.user!._id,
    req.user!.username
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Announcement permanently deleted"));
});

/**
 * POST /announcements/admin/dispatch-queue
 * Manually run the dispatch queue — processes all published-but-not-dispatched.
 * Use as a recovery mechanism if the cron missed a tick.
 * Superadmin only.
 */
const adminRunDispatchQueue = asyncHandler(async (_req, res) => {
  const result = await announcementService.processDispatchQueue();

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while running dispatch queue"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Dispatch queue complete — ${result.processed} processed, ${result.failed} failed`
      )
    );
});

export {
  getFeed,
  getChallengeAnnouncements,
  dismissAnnouncement,
  adminGetAnnouncements,
  adminGetStats,
  adminGetById,
  adminCreate,
  adminUpdate,
  adminPublish,
  adminRetract,
  adminDelete,
  adminRunDispatchQueue,
};
