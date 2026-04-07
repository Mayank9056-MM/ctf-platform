import { Types } from "mongoose";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import logger from "../../utils/logger";
import {
  AdminDispatchPayload,
  AdminNotificationFilters,
  CreateNotificationPayload,
  GetNotificationsFilters,
  InboxSummary,
  PaginationMeta,
} from "./notification.types";
import Notification, {
  INotification,
  INotificationModel,
  NotificationTypeValue,
} from "../../models/notification.model";
import { buildMeta } from "../../utils/helpers";
import { ApiError } from "../../utils/ApiError";
import User from "../../models/user.model";
import { socketEmit } from "../../socket/socket.emitters";

const audit = async (
  entry: Parameters<IAuditLogModel["record"]>[0]
): Promise<void> => {
  try {
    await (AuditLog as unknown as IAuditLogModel).record(entry);
  } catch (err) {
    logger.error("[NotificationService] Audit log write failed", err);
  }
};

/**
 * Build a MongoDB query object for fetching a user's inbox.
 *
 * @param {Types.ObjectId} userId - The ID of the user to fetch the inbox for.
 * @param {boolean} includeBroadcasts - Whether to include broadcast notifications.
 * @param {Record<string, unknown>} extra - Additional filters to apply to the query.
 *
 * @returns {Record<string, unknown>} - A MongoDB query object representing the inbox query.
 */
function buildInboxQuery(
  userId: Types.ObjectId,
  includeBroadcasts: boolean,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const personalClause: Record<string, unknown> = {
    recipient: userId,
    isDeleted: { $ne: true },
    ...extra,
  };

  if (!includeBroadcasts) return personalClause;

  const broadcastClause: Record<string, unknown> = {
    recipient: null,
    dismissedBy: { $ne: userId },
    isDeleted: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  // Merge extra filters into broadcast clause where applicable
  if (extra.isRead !== undefined) {
    // Broadcasts don't have per-user isRead — skip that filter for broadcasts
    return {
      $or: [personalClause, { ...broadcastClause }],
    };
  }

  if (extra.type) {
    broadcastClause.type = extra.type;
  }

  return {
    $or: [personalClause, broadcastClause],
  };
}

// Service

class NotificationService {
  /**
   * Create a notification.
   *
   * @param payload - Notification payload
   * @returns Promise<INotification | null> - Created notification or null if failed
   */
  async create(
    payload: CreateNotificationPayload
  ): Promise<INotification | null> {
    try {
      const {
        recipientId,
        type,
        title,
        body,
        channels = ["in_app"],
        actionUrl,
        expiresAt,
        ref,
      } = payload;

      const notification = await Notification.create({
        recipient: recipientId,
        type,
        title,
        body,
        channels,
        actionUrl: actionUrl ?? undefined,
        expiresAt: expiresAt ?? undefined,
        ref: ref
          ? {
              challengeId: ref.challengeId
                ? new Types.ObjectId(ref.challengeId)
                : undefined,
              teamId: ref.teamId ? new Types.ObjectId(ref.teamId) : undefined,
              submissionId: ref.submissionId
                ? new Types.ObjectId(ref.submissionId)
                : undefined,
              actorId: ref.actorId
                ? new Types.ObjectId(ref.actorId)
                : undefined,
              extra: ref.extra,
            }
          : undefined,
      });

      socketEmit.newNotification(recipientId?.toString() ?? null, {
        _id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl ?? undefined,
        createdAt: notification.createdAt.toISOString(),
      });

      return notification;
    } catch (err) {
      logger.error(
        "[NotificationService.create] Failed to create notification",
        err
      );
      return null;
    }
  }

  /**
   * Creates multiple notifications for multiple recipients.
   * @param {Types.ObjectId[]} recipientIds - Array of recipient IDs
   * @param {Omit<CreateNotificationPayload, "recipientId">} payload - Notification payload
   * @returns {Promise<number>} - Number of documents inserted
   */
  async createBulk(
    recipientIds: Types.ObjectId[],
    payload: Omit<CreateNotificationPayload, "recipientId">
  ): Promise<number> {
    if (recipientIds.length === 0) return 0;

    try {
      const docs = recipientIds.map((recipientId) => ({
        recipient: recipientId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        channels: payload.channels ?? ["in_app"],
        actionUrl: payload.actionUrl ?? null,
        expiresAt: payload.expiresAt ?? null,
        ref: payload.ref
          ? {
              challengeId: payload.ref.challengeId
                ? new Types.ObjectId(payload.ref.challengeId)
                : undefined,
              teamId: payload.ref.teamId
                ? new Types.ObjectId(payload.ref.teamId)
                : undefined,
              submissionId: payload.ref.submissionId
                ? new Types.ObjectId(payload.ref.submissionId)
                : undefined,
              actorId: payload.ref.actorId
                ? new Types.ObjectId(payload.ref.actorId)
                : undefined,
              extra: payload.ref.extra,
            }
          : undefined,
      }));

      const result = await Notification.insertMany(docs, {
        ordered: false, // continue on partial failure
      });

      return result.length;
    } catch (err) {
      logger.error("[NotificationService.createBulk] Bulk insert failed", err);
      return 0;
    }
  }

  // Player: Inbox

  /**
   * Retrieve the user's inbox notifications, including both personal
   * and global (broadcast) notifications.
   *
   * @param {Types.ObjectId} userId - The ID of the user to fetch notifications for.
   * @param {GetNotificationsFilters} filters - filters to apply to the inbox query.
   * @returns {Promise<{notifications: INotification[], meta: IMeta}>} - The user's inbox notifications,
   *   along with metadata about the query.
   */
  async getMyNotifications(
    userId: Types.ObjectId,
    filters: GetNotificationsFilters
  ) {
    const { page, limit, isRead, type, includeBroadcasts } = filters;

    const extra: Record<string, unknown> = {};
    if (isRead !== undefined) extra.isRead = isRead;
    if (type) extra.type = type;

    const query = buildInboxQuery(userId, includeBroadcasts, extra);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    // Annotate broadcasts with whether this user has dismissed them
    const annotated = notifications.map((n) => ({
      ...n,
      isBroadcast: n.recipient === null,
      isDismissed:
        n.recipient === null &&
        n.dismissedBy?.some((id) => id.toString() === userId.toString()),
    }));

    return { notifications: annotated, meta: buildMeta(page, limit, total) };
  }

  /**
   * Fetch a summary of a user's inbox, including the number of unread notifications
   * and a limited list of the latest notifications.
   *
   * @param userId - The ID of the user to fetch the inbox for.
   * @returns A Promise that resolves to an InboxSummary object.
   */
  async getInboxSummary(userId: Types.ObjectId): Promise<InboxSummary> {
    const [personalUnread, broadcastUnread, latest] = await Promise.all([
      Notification.countDocuments({
        recipient: userId,
        isRead: false,
        isDeleted: { $ne: true },
      }),

      (Notification as unknown as INotificationModel)
        .getActiveBroadcasts(userId)
        .then((broadcasts) => broadcasts.length),

      Notification.find(
        buildInboxQuery(userId, true, { isDeleted: { $ne: true } })
      )
        .sort({ createdAt: -1 })
        .limit(5)
        .select("type title body isRead createdAt actionUrl recipient")
        .lean(),
    ]);

    return {
      unreadCount: personalUnread + broadcastUnread,
      personalUnread,
      broadcastUnread,
      latestNotifications: latest.map((n) => ({
        _id: n._id.toString(),
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead || n.recipient === null, // broadcasts treated as "read" after display
        createdAt: n.createdAt,
        actionUrl: n.actionUrl ?? undefined,
      })),
    };
  }

  /**
   * Retrieve a notification by ID.
   * @throws {ApiError} 404 if the notification does not exist
   * @throws {ApiError} 409 if the user does not have access to the notification
   * @returns {Promise<INotification>} The notification document
   */
  async getNotificationById(
    notificationId: string,
    userId: Types.ObjectId
  ): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      isDeleted: { $ne: true },
    }).lean();

    if (!notification) throw new ApiError(404, "Notification not found");

    // Personal notifications belong to the recipient only
    // Broadcast notifications are visible to everyone
    if (
      notification.recipient !== null &&
      notification.recipient.toString() !== userId.toString()
    ) {
      throw new ApiError(409, "You do not have access to this notification");
    }

    return notification;
  }

  /**
   * Marks a list of notifications as read for a user.
   * @throws {ApiError} 404 if any of the notifications are not found
   * @throws {ApiError} 409 if any of the notifications do not belong to the user
   * @returns {Promise<number>} The number of notifications marked as read
   */
  async markAsRead(
    notificationIds: string[],
    userId: Types.ObjectId
  ): Promise<number> {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds.map((id) => new Types.ObjectId(id)) },
        recipient: userId,
        isRead: false,
        isDeleted: { $ne: true },
      },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return result.modifiedCount;
  }

  /**
   * Marks all unread personal notifications for a user as read in a single
   * bulk write. Returns the number of documents updated.
   * @param userId The ID of the user to mark all unread notifications for.
   * @returns The number of documents updated.
   */
  async markAllAsRead(userId: Types.ObjectId): Promise<number> {
    return (Notification as unknown as INotificationModel).markAllAsRead(
      userId
    );
  }

  /**
   * Record that a user dismissed a broadcast notification.
   * No-ops gracefully if already dismissed.
   * @throws {ApiError} 404 if the notification is not found or already expired
   * @param notificationId The ID of the notification to dismiss.
   * @param userId The ID of the user to dismiss the notification for.
   */
  async dismissBroadcast(
    notificationId: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: null, // must be a broadcast
      isDeleted: { $ne: true },
    });

    if (!notification) {
      throw new ApiError(
        404,
        "Broadcast notification not found or already expired"
      );
    }

    await (Notification as unknown as INotificationModel).dismissBroadcast(
      notification._id as Types.ObjectId,
      userId
    );
  }

  /**
   * Permanently delete a notification for the current user.
   * Fails with 404 if the notification is not found or does not belong to the user.
   * @param notificationId The ID of the notification to delete.
   * @param userId The ID of the user to delete the notification for.
   */
  async deleteMyNotification(
    notificationId: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const result = await Notification.updateOne(
      {
        _id: notificationId,
        recipient: userId,
        isDeleted: { $ne: true },
      },
      { $set: { isDeleted: true } }
    );

    if (result.matchedCount === 0) {
      throw new ApiError(
        404,
        "Notification not found or does not belong to you"
      );
    }
  }

  /**
   * Mark all unread notifications for a user as deleted, effectively clearing their inbox.
   * Returns the number of documents updated.
   * @param userId The ID of the user to clear the inbox for.
   */
  async clearMyInbox(userId: Types.ObjectId): Promise<number> {
    const result = await Notification.updateMany(
      {
        recipient: userId,
        isDeleted: { $ne: true },
      },
      { $set: { isDeleted: true } }
    );

    return result.modifiedCount;
  }

  // Admin

  /**
   * Admin dispatch — same as create but accepts string IDs from request body.
   * Useful for triggering notifications from the admin dashboard.
   * Validates recipient exists for personal notifications.
   * Writes an audit log on success.
   * @param {AdminDispatchPayload} payload
   * @returns {Promise<INotification | null>}
   */
  async adminDispatch(
    payload: AdminDispatchPayload
  ): Promise<INotification | null> {
    const {
      recipientId,
      type,
      title,
      body,
      channels,
      actionUrl,
      expiresAt,
      ref,
      requesterId,
      requesterUsername,
    } = payload;

    // Validate recipient exists for personal notifications
    if (recipientId) {
      const userExists = await User.exists({
        _id: recipientId,
        isDeleted: false,
      });

      if (!userExists) {
        throw new ApiError(404, `Recipient user "${recipientId}" not found`);
      }
    }

    const notification = await this.create({
      recipientId: recipientId ? new Types.ObjectId(recipientId) : null,
      type: type as NotificationTypeValue,
      title,
      body,
      channels,
      actionUrl,
      expiresAt,
      ref,
    });

    if (!notification) {
      throw new ApiError(500, "Failed to dispatch notification");
    }

    await audit({
      action: "notification:dispatch",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: notification._id as Types.ObjectId,
        collection: "Notification",
        label: title,
      },
      metadata: {
        recipientId: recipientId ?? "broadcast",
        type,
        channels: channels ?? ["in_app"],
      },
    });

    return notification;
  }

  /**
   * Fetches notifications for admin viewing purposes.
   * @param filters - Filter object for fetching notifications.
   * @returns - An object containing the notifications and pagination metadata.
   */
  async getAdminNotifications(filters: AdminNotificationFilters) {
    const {
      page,
      limit,
      recipientId,
      type,
      channel,
      isRead,
      isBroadcast,
      from,
      to,
    } = filters;

    const query: Record<string, unknown> = {};

    if (recipientId) query.recipient = new Types.ObjectId(recipientId);
    if (type) query.type = type;
    if (channel) query.channels = channel;
    if (isRead !== undefined) query.isRead = isRead;
    if (isBroadcast === true) query.recipient = null;
    if (isBroadcast === false) query.recipient = { $ne: null };

    if (from || to) {
      query.createdAt = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("recipient", "username email avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return { notifications, meta: buildMeta(page, limit, total) };
  }

  async getAdminNotificationById(notificationId: string) {
    const notification = await Notification.findById(notificationId)
      .populate("recipient", "username email avatar")
      .lean();

    if (!notification) throw new ApiError(404, "Notification not found");

    return notification;
  }

  /**
   * Deletes a notification and persists the change.
   * @throws {ApiError} 404 if the notification is not found
   * @throws {ApiError} 400 if the notification is a broadcast
   */
  async adminDeleteNotification(
    notificationId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<void> {
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) throw new ApiError(404, "Notification not found");

    await audit({
      action: "notification:dispatch",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "superadmin",
        type: "admin",
      },
      target: {
        id: new Types.ObjectId(notificationId),
        collection: "Notification",
        label: notification.title,
      },
      metadata: { action: "notification_deleted" },
    });
  }

  /**
   * Marks a notification as read and persists the change.
   * @throws {ApiError} 404 if the notification is not found
   * @throws {ApiError} 400 if the notification is a broadcast
   * @returns {Promise<INotification>} The updated notification
   */
  async adminMarkRead(
    notificationId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new ApiError(404, "Notification not found");

    if (notification.recipient === null) {
      throw new ApiError(
        400,
        "Broadcast notifications cannot be marked as read — use dismiss instead"
      );
    }

    const updated = await notification.markAsRead();

    await audit({
      action: "notification:mark_read",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "admin",
        type: "admin",
      },
      target: {
        id: notification._id as Types.ObjectId,
        collection: "Notification",
        label: notification.title,
      },
    });

    return updated;
  }

  /**
   * Retrieves aggregated statistics for admin ops.
   * @returns A promise which resolves to an object containing statistics by category, total number of challenges, visible challenges, and total solves.
   */
  async getAdminStats() {
    const [totals, byType, byChannel, recent] = await Promise.all([
      Notification.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            broadcasts: [{ $match: { recipient: null } }, { $count: "count" }],
            unread: [
              {
                $match: {
                  recipient: { $ne: null },
                  isRead: false,
                  isDeleted: { $ne: true },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ]),

      Notification.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            readCount: { $sum: { $cond: ["$isRead", 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),

      Notification.aggregate([
        { $unwind: "$channels" },
        {
          $group: {
            _id: "$channels",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Last 30 days — notifications per day
      Notification.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
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
    ]);

    const t = totals[0];

    return {
      total: t?.total?.[0]?.count ?? 0,
      broadcasts: t?.broadcasts?.[0]?.count ?? 0,
      unread: t?.unread?.[0]?.count ?? 0,
      byType,
      byChannel,
      recentActivity: recent,
    };
  }

  // Typed Helpers

  /**
   * Notifies a user that they have solved a challenge, and provides some additional metadata.
   * @param {Types.ObjectId} userId - The user who solved the challenge.
   * @param {string} challengeId - The challenge that was solved.
   * @param {string} challengeTitle - The title of the challenge that was solved.
   * @param {number} pointsAwarded - The number of points the user earned for solving the challenge.
   * @param {boolean} isFirstBlood - Whether the user was the first to solve the challenge.
   * @param {string} submissionId - The submission ID associated with the solve.
   */
  async notifyCorrectSolve(
    userId: Types.ObjectId,
    challengeId: string,
    challengeTitle: string,
    pointsAwarded: number,
    isFirstBlood: boolean,
    submissionId: string
  ): Promise<void> {
    const type = isFirstBlood ? "submission_first_blood" : "submission_correct";

    const title = isFirstBlood
      ? `🩸 First blood on "${challengeTitle}"!`
      : `✅ Correct flag on "${challengeTitle}"`;

    const body = isFirstBlood
      ? `You're the first to solve "${challengeTitle}"! +${pointsAwarded} points`
      : `You solved "${challengeTitle}" and earned ${pointsAwarded} points.`;

    await this.create({
      recipientId: userId,
      type,
      title,
      body,
      channels: ["in_app"],
      actionUrl: `/challenges/${challengeId}`,
      ref: {
        challengeId,
        submissionId,
      },
    });
  }

  /**
   * Sends a notification to a user when they receive a team invite
   * @param inviteeId - The id of the user receiving the invite
   * @param inviterUsername - The username of the user sending the invite
   * @param teamName - The name of the team being invited to
   * @param teamId - The id of the team being invited to
   * @param inviterId - The id of the user sending the invite
   */
  async notifyTeamInvite(
    inviteeId: Types.ObjectId,
    inviterUsername: string,
    teamName: string,
    teamId: string,
    inviterId: string
  ): Promise<void> {
    await this.create({
      recipientId: inviteeId,
      type: "team_invite_received",
      title: `Team invitation from ${inviterUsername}`,
      body: `${inviterUsername} has invited you to join "${teamName}". Check your team invites.`,
      channels: ["in_app"],
      actionUrl: "/team/invites",
      ref: { teamId, actorId: inviterId },
    });
  }

  /**
   * Notifies the team owner when a user responds to an invite.
   * @param ownerId - The ID of the team owner.
   * @param respondingUsername - The username of the user responding to the invite.
   * @param teamName - The name of the team.
   * @param teamId - The ID of the team.
   * @param respondingUserId - The ID of the user responding to the invite.
   * @param accepted - Whether the invite was accepted or declined.
   */
  async notifyInviteResponse(
    ownerId: Types.ObjectId,
    respondingUsername: string,
    teamName: string,
    teamId: string,
    respondingUserId: string,
    accepted: boolean
  ): Promise<void> {
    await this.create({
      recipientId: ownerId,
      type: accepted ? "team_invite_accepted" : "team_invite_declined",
      title: accepted
        ? `${respondingUsername} accepted your team invite`
        : `${respondingUsername} declined your team invite`,
      body: accepted
        ? `${respondingUsername} has joined "${teamName}".`
        : `${respondingUsername} declined the invitation to join "${teamName}".`,
      channels: ["in_app"],
      actionUrl: `/team/${teamId}`,
      ref: { teamId, actorId: respondingUserId },
    });
  }

  /**
   * Notifies a team that a member has solved a challenge.
   * @param {Types.ObjectId[]} teamMemberIds - The IDs of the team members to notify.
   * @param {Types.ObjectId} solverUserId - The ID of the user who solved the challenge.
   * @param {string} solverUsername - The username of the user who solved the challenge.
   * @param {string} challengeTitle - The title of the challenge that was solved.
   * @param {string} challengeId - The ID of the challenge that was solved.
   */
  async notifyTeamChallengeSolved(
    teamMemberIds: Types.ObjectId[],
    solverUserId: Types.ObjectId,
    solverUsername: string,
    challengeTitle: string,
    challengeId: string
  ): Promise<void> {
    // Exclude the solver from the notification
    const recipients = teamMemberIds.filter(
      (id) => id.toString() !== solverUserId.toString()
    );

    if (recipients.length === 0) return;

    await this.createBulk(recipients, {
      type: "team_challenge_solved",
      title: `${solverUsername} solved a challenge!`,
      body: `Your teammate ${solverUsername} solved "${challengeTitle}".`,
      channels: ["in_app"],
      actionUrl: `/challenges/${challengeId}`,
      ref: {
        challengeId,
        actorId: solverUserId.toString(),
      },
    });
  }

  /**
   * Sends a notification to a user that their account has been banned.
   * @param {Types.ObjectId} userId - The id of the user to notify.
   * @param {string} reason - The reason for the ban.
   */
  async notifyAccountBanned(
    userId: Types.ObjectId,
    reason: string
  ): Promise<void> {
    await this.create({
      recipientId: userId,
      type: "account_banned",
      title: "Your account has been suspended",
      body: `Your account has been suspended. Reason: ${reason}`,
      channels: ["in_app", "email"],
    });
  }

  /**
   * Send a notification to a user that their account has been unbanned.
   *
   * The notification is sent to both in-app and email channels.
   *
   * @param {Types.ObjectId} userId - The ID of the user to notify.
   *
   * @return {Promise<void>} - A promise that resolves when the notification has been sent.
   */
  async notifyAccountUnbanned(userId: Types.ObjectId): Promise<void> {
    await this.create({
      recipientId: userId,
      type: "account_unbanned",
      title: "Your account has been reinstated",
      body: "Your account suspension has been lifted. You can now participate again.",
      channels: ["in_app", "email"],
    });
  }
}

export const notificationService = new NotificationService();
