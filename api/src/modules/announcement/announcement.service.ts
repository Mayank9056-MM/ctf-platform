import { Types } from "mongoose";
import User from "../../models/user.model";
import Challenge from "../../models/challenge.model";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import { notificationService } from "../notification/notification.service";
import { ApiError } from "../../utils/ApiError";
import logger from "../../utils/logger";
import {
  AdminAnnouncementFilters,
  AnnouncementFeedFilters,
  AnnouncementStats,
  CreateAnnouncementPayload,
  PaginationMeta,
  RetractAnnouncementPayload,
  UpdateAnnouncementPayload,
} from "./announcement.types";
import { buildMeta } from "../../utils/helpers";
import Announcement, {
  IAnnouncement,
  IAnnouncementModel,
} from "../../models/anouncement.model";
import { socketEmit } from "../../socket/socket.emitters";

// Internal Helpers

const audit = async (
  entry: Parameters<IAuditLogModel["record"]>[0]
): Promise<void> => {
  try {
    await (AuditLog as unknown as IAuditLogModel).record(entry);
  } catch (err) {
    logger.error("[AnnouncementService] Audit log write failed", err);
  }
};

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  warning: 3,
  success: 2,
  info: 1,
};

// Service

class AnnouncementService {
  // Player: Feed

  async getFeed(
    userId: Types.ObjectId,
    hasTeam: boolean,
    filters: AnnouncementFeedFilters
  ) {
    const { page, limit, severity, challengeId } = filters;

    // Build the audience filter — same logic as model's static getFeed
    const audienceFilter = {
      $or: [
        { audience: "all" },
        { audience: hasTeam ? "teams" : "solo" },
        { audience: "specific", targetUsers: userId },
      ],
    };

    const query: Record<string, unknown> = {
      isPublished: true,
      isRetracted: false,
      dismissedBy: { $ne: userId },
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
        audienceFilter,
      ],
    };

    if (severity) query.severity = severity;
    if (challengeId) query.challenge = new Types.ObjectId(challengeId);

    // Fetch all matching (no skip/limit yet — we sort by severity weight first)
    const all = await Announcement.find(query)
      .populate("author", "username avatar")
      .populate("challenge", "title slug category")
      .lean();

    // Sort: severity weight desc, then publishedAt desc within same weight
    const sorted = all.sort((a, b) => {
      const sw =
        (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0);
      if (sw !== 0) return sw;
      return (
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
      );
    });

    const total = sorted.length;
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    return {
      announcements: paginated,
      meta: buildMeta(page, limit, total),
    };
  }

  /**
   * Retrieves all announcements for a given challenge.
   * @param {string} challengeId - The id of the challenge to fetch announcements for.
   * @returns {Promise<{ announcements: IAnnouncement[], meta: IMeta }>} - A promise which resolves to an object containing the announcements and metadata.
   * @throws {ApiError} 404 - If the challenge is not found.
   */
  async getChallengeAnnouncements(challengeId: string) {
    const challengeExists = await Challenge.exists({
      _id: challengeId,
      isActive: true,
    });

    if (!challengeExists) throw new ApiError(404, "Challenge not found");

    return (Announcement as unknown as IAnnouncementModel).getForChallenge(
      new Types.ObjectId(challengeId)
    );
  }

  /**
   * Dismisses an announcement, marking it as dismissed by the user.
   * If the announcement is not found or is no longer active, a 404 error will be thrown.
   * @param {string} announcementId - The ID of the announcement to dismiss.
   * @param {Types.ObjectId} userId - The ID of the user dismissing the announcement.
   * @throws {ApiError} 404 - If the announcement is not found or is no longer active.
   * @returns {Promise<void>} - A promise that resolves when the announcement is dismissed.
   */
  async dismissAnnouncement(
    announcementId: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const announcement = await Announcement.findOne({
      _id: announcementId,
      isPublished: true,
      isRetracted: false,
    });

    if (!announcement) {
      throw new ApiError(404, "Announcement not found or no longer active");
    }

    await announcement.dismiss(userId);
  }

  // Admin: CRUD

  async createAnnouncement(
    payload: CreateAnnouncementPayload
  ): Promise<IAnnouncement> {
    const {
      title,
      body,
      severity = "info",
      audience = "all",
      targetUsers,
      challengeId,
      actionUrl,
      actionLabel,
      expiresAt,
      publishImmediately = false,
      authorId,
      authorUsername,
    } = payload;

    // Pre-create validation
    if (audience === "specific" && (!targetUsers || targetUsers.length === 0)) {
      throw new ApiError(
        400,
        "targetUsers is required when audience is 'specific'"
      );
    }

    if (targetUsers?.length) {
      const foundCount = await User.countDocuments({
        _id: { $in: targetUsers.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
      });

      if (foundCount !== targetUsers.length) {
        throw new ApiError(
          400,
          "One or more targetUsers do not exist or have been deleted"
        );
      }
    }

    if (challengeId) {
      const challengeExists = await Challenge.exists({
        _id: challengeId,
        isActive: true,
      });

      if (!challengeExists) {
        throw new ApiError(
          400,
          `Challenge "${challengeId}" does not exist or is not active`
        );
      }
    }

    // Create
    const announcement = await Announcement.create({
      title,
      body,
      severity,
      audience,
      author: authorId,
      targetUsers: targetUsers?.map((id) => new Types.ObjectId(id)) ?? [],
      challenge: challengeId ? new Types.ObjectId(challengeId) : undefined,
      actionUrl: actionUrl ?? undefined,
      actionLabel: actionLabel ?? undefined,
      expiresAt: expiresAt ?? undefined,
      isPublished: false, // always start as draft — publish() stamps publishedAt
    });

    await audit({
      action: "announcement:create",
      outcome: "success",
      actor: {
        userId: authorId,
        username: authorUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: announcement._id as Types.ObjectId,
        collection: "Announcement",
        label: announcement.title,
      },
      metadata: {
        severity,
        audience,
        publishImmediately,
      },
    });

    // Publish inline if requested
    if (publishImmediately) {
      return this.publishAnnouncement(
        announcement._id.toString(),
        authorId,
        authorUsername
      );
    }

    return announcement;
  }

  /**
   * Updates an announcement by its ID.
   * Requires the requester to have the "admin" role.
   * @param {UpdateAnnouncementPayload} payload - Object containing:
   *   - announcementId: string - The ID of the announcement to update.
   *   - title?: string - Optional new title for the announcement.
   *   - body?: string - Optional new body for the announcement.
   *   - severity?: AnnouncementSeverity - Optional new severity for the announcement.
   *   - audience?: AnnouncementAudience - Optional new audience for the announcement.
   *   - targetUsers?: string[] - Optional new target users if audience is "specific".
   *   - challengeId?: string | null - Optional new or null challenge ID.
   *   - actionUrl?: string | null - Optional new or null action URL.
   *   - actionLabel?: string | null - Optional new or null action label.
   *   - expiresAt?: Date | null - Optional new or null expiration date.
   *   - requesterId: Types.ObjectId - The ID of the user making the request.
   *   - requesterUsername: string - The username of the user making the request.
   * @throws {ApiError} 404 - If the announcement is not found.
   * @throws {ApiError} 409 - If the announcement is retracted.
   * @returns {Promise<IAnnouncement>} - A promise that resolves to the updated announcement.
   */
  async updateAnnouncement(
    payload: UpdateAnnouncementPayload
  ): Promise<IAnnouncement> {
    const {
      announcementId,
      targetUsers,
      challengeId,
      requesterId,
      requesterUsername,
      ...rest
    } = payload;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new ApiError(404, "Announcement not found");

    if (announcement.isRetracted) {
      throw new ApiError(
        409,
        "Retracted announcements cannot be edited. Create a new announcement instead."
      );
    }

    // Validate new targetUsers if audience is or will be "specific"
    const newAudience = rest.audience ?? announcement.audience;

    if (newAudience === "specific") {
      const resolvedTargetUsers =
        targetUsers ?? announcement.targetUsers.map((id) => id.toString());

      if (!resolvedTargetUsers.length) {
        throw new ApiError(
          400,
          "targetUsers is required when audience is 'specific'"
        );
      }

      const foundCount = await User.countDocuments({
        _id: { $in: resolvedTargetUsers.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
      });

      if (foundCount !== resolvedTargetUsers.length) {
        throw new ApiError(
          400,
          "One or more targetUsers do not exist or have been deleted"
        );
      }
    }

    if (challengeId !== undefined) {
      if (challengeId !== null) {
        const challengeExists = await Challenge.exists({
          _id: challengeId,
          isActive: true,
        });

        if (!challengeExists) {
          throw new ApiError(
            400,
            `Challenge "${challengeId}" does not exist or is not active`
          );
        }
      }
      announcement.challenge = challengeId
        ? (new Types.ObjectId(
            challengeId
          ) as unknown as typeof announcement.challenge)
        : (null as unknown as typeof announcement.challenge);
    }

    // Apply scalar updates
    const updatableFields = [
      "title",
      "body",
      "severity",
      "audience",
      "actionUrl",
      "actionLabel",
      "expiresAt",
    ] as const;

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const changedFields: string[] = [];

    for (const field of updatableFields) {
      const val = rest[field as keyof typeof rest];
      if (val === undefined) continue;

      const current = (announcement as unknown as Record<string, unknown>)[
        field
      ];
      if (JSON.stringify(current) !== JSON.stringify(val)) {
        before[field] = current;
        after[field] = val;
        changedFields.push(field);
        (announcement as unknown as Record<string, unknown>)[field] = val;
      }
    }

    if (targetUsers !== undefined) {
      announcement.targetUsers = (targetUsers.length > 0
        ? targetUsers.map((id) => new Types.ObjectId(id))
        : []) as unknown as typeof announcement.targetUsers;
      changedFields.push("targetUsers");
    }

    await announcement.save();

    if (changedFields.length > 0) {
      await audit({
        action: "announcement:update",
        outcome: "success",
        actor: {
          userId: requesterId,
          username: requesterUsername,
          role: "admin",
          type: "admin",
        },
        target: {
          id: announcement._id as Types.ObjectId,
          collection: "Announcement",
          label: announcement.title,
        },
        diff: { before, after, changedFields },
      });
    }

    return announcement;
  }

  /**
   * Publishes an announcement, making it visible to users.
   * If the announcement was previously retracted, a 409 error will be thrown.
   * The notification will only be dispatched on the first publish.
   * @throws {ApiError} 404 - If the announcement is not found.
   * @throws {ApiError} 409 - If the announcement is retracted.
   * @returns {Promise<IAnnouncement>} - A promise that resolves to the published announcement.
   */
  async publishAnnouncement(
    announcementId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<IAnnouncement> {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new ApiError(404, "Announcement not found");

    if (announcement.isRetracted) {
      throw new ApiError(409, "A retracted announcement cannot be published");
    }

    const wasAlreadyPublished = announcement.isPublished;

    // Model's publish() method stamps publishedAt and is idempotent
    await announcement.publish();

    socketEmit.announcementPublished({
      _id: announcement._id.toString(),
      title: announcement.title,
      severity: announcement.severity,
      audience: announcement.audience,
    });

    await audit({
      action: "announcement:publish",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: announcement._id as Types.ObjectId,
        collection: "Announcement",
        label: announcement.title,
      },
      metadata: { wasAlreadyPublished },
    });

    // Dispatch notification only on first publish — avoid duplicate notifications
    if (!wasAlreadyPublished && !announcement.notificationDispatched) {
      this.dispatchPublishNotification(announcement).catch((err) =>
        logger.error("[AnnouncementService] Notification dispatch failed", err)
      );
    }

    return announcement;
  }

  /**
   * Retracts an announcement by its ID.
   * Requires the requester to have the "admin" role.
   * @param {RetractAnnouncementPayload} payload - Object containing:
   *   - announcementId: string - The ID of the announcement to retract.
   *   - reason?: string - Optional reason for retraction.
   *   - requesterId: Types.ObjectId - The ID of the user making the request.
   *   - requesterUsername: string - The username of the user making the request.
   * @throws {ApiError} 404 - If the announcement is not found.
   * @throws {ApiError} 409 - If the announcement is already retracted.
   * @returns {Promise<IAnnouncement>} - A promise that resolves to the retracted announcement.
   */
  async retractAnnouncement(
    payload: RetractAnnouncementPayload
  ): Promise<IAnnouncement> {
    const { announcementId, reason, requesterId, requesterUsername } = payload;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new ApiError(404, "Announcement not found");

    if (announcement.isRetracted) {
      throw new ApiError(409, "Announcement is already retracted");
    }

    await announcement.retract(reason);

    await audit({
      action: "announcement:retract",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: announcement._id as Types.ObjectId,
        collection: "Announcement",
        label: announcement.title,
      },
      metadata: { reason: reason ?? null },
    });

    return announcement;
  }

  /**
   * Deletes an announcement by its ID.
   * Requires the requester to have the "superadmin" role.
   * @param {string} announcementId - The ID of the announcement to delete.
   * @param {Types.ObjectId} requesterId - The ID of the user making the request.
   * @param {string} requesterUsername - The username of the user making the request.
   * @throws {ApiError} 404 - If the announcement is not found.
   * @returns {Promise<void>} - A promise that resolves when the announcement is deleted.
   */
  async deleteAnnouncement(
    announcementId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<void> {
    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) throw new ApiError(404, "Announcement not found");

    await audit({
      action: "announcement:delete",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "superadmin",
        type: "admin",
      },
      target: {
        id: new Types.ObjectId(announcementId),
        collection: "Announcement",
        label: announcement.title,
      },
    });
  }

  // Admin: Query

  /**
   * Retrieves a list of announcements with filtering and pagination.
   *
   * @param {AdminAnnouncementFilters} filters - Object containing filters:
   *   - page: number - Page number (1-indexed)
   *   - limit: number - Number of items per page
   *   - isPublished?: boolean - Filter by published status
   *   - isRetracted?: boolean - Filter by retracted status
   *   - severity?: AnnouncementSeverity - Filter by severity
   *   - audience?: AnnouncementAudience - Filter by audience
   *   - authorId?: string - Filter by author ID
   *   - challengeId?: string - Filter by challenge ID
   *   - search?: string - Fuzzy search for title and body
   *   - from?: Date - Filter by createdAt from
   *   - to?: Date - Filter by createdAt to
   *   - sortBy: string - Sort by 'publishedAt', 'createdAt', or 'severity'
   *   - sortOrder: string - Sort order ('asc' or 'desc')
   *
   * @returns {Promise<{announcements: IAnnouncement[], meta: PaginationMeta}>} - Promise resolving to an object containing the list of announcements and pagination metadata.
   */
  async getAdminAnnouncements(filters: AdminAnnouncementFilters) {
    const {
      page,
      limit,
      isPublished,
      isRetracted,
      severity,
      audience,
      authorId,
      challengeId,
      search,
      from,
      to,
      sortBy,
      sortOrder,
    } = filters;

    const query: Record<string, unknown> = {};

    if (isPublished !== undefined) query.isPublished = isPublished;
    if (isRetracted !== undefined) query.isRetracted = isRetracted;
    if (severity) query.severity = severity;
    if (audience) query.audience = audience;
    if (authorId) query.author = new Types.ObjectId(authorId);
    if (challengeId) query.challenge = new Types.ObjectId(challengeId);

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
      ];
    }

    if (from || to) {
      query.createdAt = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    // severity sort: use a compound sort with sortBy primary
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      publishedAt: { publishedAt: sortOrder === "asc" ? 1 : -1 },
      createdAt: { createdAt: sortOrder === "asc" ? 1 : -1 },
      severity: { severity: sortOrder === "asc" ? 1 : -1 },
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate("author", "username avatar email")
        .populate("challenge", "title slug category")
        .sort(sortMap[sortBy] ?? { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(query),
    ]);

    return { announcements, meta: buildMeta(page, limit, total) };
  }

  /**
   * Get single announcement by ID — admin view (no audience filter).
   */
  async getAdminAnnouncementById(announcementId: string) {
    const announcement = await Announcement.findById(announcementId)
      .populate("author", "username avatar email role")
      .populate("challenge", "title slug category difficulty")
      .lean();

    if (!announcement) throw new ApiError(404, "Announcement not found");

    return announcement;
  }

  /**
   * Retrieves statistics for admin dashboard.
   * Returns an object with the following properties:
   * - total: The total number of announcements.
   * - published: The number of published announcements.
   * - draft: The number of draft announcements.
   * - retracted: The number of retracted announcements.
   * - expired: The number of expired announcements.
   * - bySeverity: An array of objects with properties severity and count, sorted by count in descending order.
   * - byAudience: An array of objects with properties audience and count, sorted by count in descending order.
   * - pendingDispatch: The number of announcements pending dispatch.
   * - avgDismissRate: The average dismiss rate for all published announcements.
   */
  async getAdminStats(): Promise<AnnouncementStats> {
    const now = new Date();

    const [totals, bySeverity, byAudience, pendingDispatch] = await Promise.all(
      [
        Announcement.aggregate([
          {
            $facet: {
              total: [{ $count: "n" }],
              published: [
                { $match: { isPublished: true, isRetracted: false } },
                { $count: "n" },
              ],
              draft: [
                { $match: { isPublished: false, isRetracted: false } },
                { $count: "n" },
              ],
              retracted: [{ $match: { isRetracted: true } }, { $count: "n" }],
              expired: [
                {
                  $match: {
                    expiresAt: { $lt: now },
                    isRetracted: false,
                  },
                },
                { $count: "n" },
              ],
              dismissStats: [
                { $match: { isPublished: true, isRetracted: false } },
                {
                  $project: {
                    dismissRate: {
                      $cond: [
                        { $gt: [{ $size: "$dismissedBy" }, 0] },
                        {
                          $divide: [
                            { $size: "$dismissedBy" },
                            { $max: [1, { $size: "$dismissedBy" }] },
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
                { $group: { _id: null, avg: { $avg: "$dismissRate" } } },
              ],
            },
          },
        ]),

        Announcement.aggregate([
          {
            $group: {
              _id: "$severity",
              count: { $sum: 1 },
            },
          },
          { $project: { severity: "$_id", count: 1, _id: 0 } },
          { $sort: { count: -1 } },
        ]),

        Announcement.aggregate([
          {
            $group: {
              _id: "$audience",
              count: { $sum: 1 },
            },
          },
          { $project: { audience: "$_id", count: 1, _id: 0 } },
          { $sort: { count: -1 } },
        ]),

        (Announcement as unknown as IAnnouncementModel)
          .getPendingDispatch()
          .then((r) => r.length),
      ]
    );

    const t = totals[0];

    return {
      total: t?.total?.[0]?.n ?? 0,
      published: t?.published?.[0]?.n ?? 0,
      draft: t?.draft?.[0]?.n ?? 0,
      retracted: t?.retracted?.[0]?.n ?? 0,
      expired: t?.expired?.[0]?.n ?? 0,
      bySeverity,
      byAudience,
      pendingDispatch,
      avgDismissRate:
        Math.round((t?.dismissStats?.[0]?.avg ?? 0) * 100 * 100) / 100,
    };
  }

  // Notification Dispatch

  /**
   * Dispatches a notification for an announcement to its intended audience.
   * Marks the announcement as dispatched to prevent double-notifications.
   * @param {IAnnouncement} announcement - The announcement to dispatch.
   * @returns {Promise<void>} - A promise that resolves when the notification is dispatched.
   */
  private async dispatchPublishNotification(
    announcement: IAnnouncement
  ): Promise<void> {
    const { audience, title, body, actionUrl, _id } = announcement;

    try {
      if (audience === "all") {
        // Broadcast — single document, no fan-out needed
        await notificationService.create({
          recipientId: null,
          type: "admin_announcement",
          title,
          body,
          channels: ["in_app"],
          actionUrl: actionUrl ?? undefined,
          ref: { actorId: announcement.author?.toString() },
        });
      } else if (audience === "specific") {
        // Personal notifications to explicit user list
        const recipientIds = announcement.targetUsers.map(
          (id) => new Types.ObjectId(id.toString())
        );

        await notificationService.createBulk(recipientIds, {
          type: "admin_announcement",
          title,
          body,
          channels: ["in_app"],
          actionUrl: actionUrl ?? undefined,
        });
      } else {
        // teams or solo — query users matching the condition
        const userQuery =
          audience === "teams"
            ? { teamId: { $ne: null }, isDeleted: false, isBanned: false }
            : { teamId: null, isDeleted: false, isBanned: false };

        const users = await User.find(userQuery).select("_id").lean();
        const recipientIds = users.map((u) => u._id as Types.ObjectId);

        if (recipientIds.length > 0) {
          await notificationService.createBulk(recipientIds, {
            type: "admin_announcement",
            title,
            body,
            channels: ["in_app"],
            actionUrl: actionUrl ?? undefined,
          });
        }
      }

      // Mark dispatched — prevents double-notify on retries
      await (Announcement as unknown as IAnnouncementModel).markDispatched([
        _id as Types.ObjectId,
      ]);
    } catch (err) {
      logger.error(
        `[AnnouncementService] Failed to dispatch notifications for announcement ${_id}`,
        err
      );
      // Do not re-throw — notification failure must not fail the publish
    }
  }

  /**
   * Processes the dispatch queue, attempting to dispatch notifications for each pending announcement.
   * Returns an object containing two properties: processed and failed.
   * The processed property contains the number of announcements that were successfully dispatched,
   * and the failed property contains the number of announcements that failed to dispatch.
   */
  async processDispatchQueue(): Promise<{
    processed: number;
    failed: number;
  }> {
    const pending = await (
      Announcement as unknown as IAnnouncementModel
    ).getPendingDispatch();

    let processed = 0;
    let failed = 0;

    for (const doc of pending) {
      try {
        const announcement = await Announcement.findById(doc._id);
        if (!announcement) continue;

        await this.dispatchPublishNotification(announcement);
        processed++;
      } catch (err) {
        failed++;
        logger.error(
          `[AnnouncementService.processDispatchQueue] Failed for ${doc._id}`,
          err
        );
      }
    }

    if (processed > 0 || failed > 0) {
      logger.info(
        `[AnnouncementService] Dispatch queue: ${processed} processed, ${failed} failed`
      );
    }

    return { processed, failed };
  }
}

export const announcementService = new AnnouncementService();
