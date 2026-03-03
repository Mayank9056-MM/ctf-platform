import mongoose, { Types, Document } from "mongoose";

// enums

/**
 * All notification types the platform supports
 *
 * naming convention: <subject>_<event>
 * e.g. Challenge_Published = a challenge was publish by an admin
 */
export const NotificationType = {
  //challenge

  /** A new challenge has been publish and is now visible */
  CHALLENGE_PUBLISHED: "challenge_published",

  /** A challenge the user attempted was closed / archived */
  CHALLENGE_CLOSED: "challenge_closed",

  /** A hint was added to a challenge the user has attempted */
  CHALLENGE_HINT_ADDED: "challenge_hint_added",

  // submission

  /** User submitted the correct flag - confirmation receipt */
  SUBMISSION_CORRECT: "submission_correct",

  /** User achieved first blood on a challenge */
  SUBMISSION_FIRST_BLOOD: "submission_first_blood",

  // team

  /** User has been invited to join a team */
  TEAM_INVITE_RECEIVED: "team_invite_received",

  /** A team invite the user has sent was accepted */
  TEAM_INVITE_ACCEPTED: "team_invite_accepted",

  /** A team invite the user has send was declined */
  TEAM_INVITE_DECLINED: "team_invite_declined",

  /** A member was left or removed from the user's team */
  TEAM_MEMBER_LEFT: "team_member_left",

  /** A teammate solved a challenge */
  TEAM_CHALLENGE_SOLVED: "team_challenge_solved",

  // account

  /** User's score changed */
  ACCOUNT_SCORE_UPDATED: "account_score_updated",

  /** User's account was banned */
  ACCOUNT_BANNED: "account_banned",

  /** User's account ban was lifted */
  ACCOUNT_UNBANNED: "account_unbanned",

  /** User's email was successfully verified */
  ACCOUNT_EMAIL_VERIFIED: "account_email_verified",

  // admin
  /** Platform-wide announcement from an admin */
  ADMIN_ANNOUNCEMENT: "admin_announcement",
  /** CTF event is starting soon */
  EVENT_STARTING_SOON: "event_starting_soon",
  /** CTF event has ended */
  EVENT_ENDED: "event_ended",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Delivery channels.
 * A notification record can be associated with one or more channels —
 * the notification service decides which to fan out to based on user preferences.
 */
export type NotificationChannel = "in_app" | "email" | "push";

// sub-document

/**
 * Loosely-typed but intentionally narrow reference bag.
 * Only IDs are stored here; the client resolves full documents separately.
 * Keeping this lean avoids stale denormalised data.
 */
export interface INotificationRef {
  challengeId?: Types.ObjectId;
  teamId?: Types.ObjectId;
  submissionId?: Types.ObjectId;

  /** Generic actor: the user who *caused* this notification (e.g. the inviter) */
  actorId?: Types.ObjectId;

  /** Arbitrary extra key-value pairs for future extensibility */
  extra?: Record<string, string | number | boolean>;
}

export interface INotification extends Document {
  /**
   * Recipient of the notification
   * Null for broadcast / admin announcements targeting all users
   */
  recipient: Types.ObjectId | null;

  type: NotificationTypeValue;

  /** Short human readable title */
  title: string;

  /** full notification body */
  body: string;

  /** Whether the user has read / acknowledged the notification */
  isRead: boolean;

  /** Timestamp the user dismissed/read the notification */
  readAt?: Date;

  /**
   * Channels this notification was (or should be) delivered on.
   * The notification service populates this; the model stores it for audit.
   */
  channels: NotificationChannel[];

  /** Contextual references — IDs of related documents */
  ref: INotificationRef;

  /**
   * For broadcast notifications (recipient = null), this is the subset of
   * user IDs that have explicitly dismissed / read the message so the client
   * can hide it without duplicating a document per user.
   */
  dismissedBy: Types.ObjectId[];

  /**
   * Optional deep-link path the client should navigate to on tap/click.
   * e.g. "/challenges/web/sql-injection-abc123"
   */
  actionUrl?: string;

  /**
   * Hard expiry: notification should not be displayed after this time.
   * Used for time-sensitive events (e.g. EVENT_STARTING_SOON).
   * TTL index deletes the document automatically after expiry.
   */
  expiresAt?: Date;
  isDeleted?: boolean;

  createdAt: Date;
  updatedAt: Date;

  // instance model
  markAsRead(): Promise<INotification>;
}

const notificationRefSchema = new mongoose.Schema<INotificationRef>(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    extra: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema<INotification>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = broadcast
      index: true,
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: Object.values(NotificationType),
        message: "Invalid notification type: {VALUE}",
      },
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [120, "Notification title cannot exceed 120 characters"],
    },
    body: {
      type: String,
      required: [true, "Notification body is required"],
      trim: true,
      maxlength: [1000, "Body cannot exceed 1000 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    channels: {
      type: [String],
      enum: {
        values: ["in_app", "email", "push"] satisfies NotificationChannel[],
        message: "Invalid channel: {VALUE}",
      },
      default: ["in_app"],
    },
    ref: {
      type: notificationRefSchema,
      default: () => ({}),
    },
    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    actionUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Action URL cannot exceed 500 characters"],
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes

// Primary inbox query: unread notifications for a user, newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Fetch all notifications for a user (read + unread), for the full history view
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Broadcast lookup: find active global announcements not yet dismissed by a user
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

// TTL index: MongoDB auto-deletes documents once expiresAt is reached.
// Documents without expiresAt (null) are excluded from TTL expiry.
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, sparse: true }
);

// virtuals

/** True if the notification has passed its expiry, even before MongoDB's TTL sweep */
notificationSchema.virtual("isExpired").get(function (this: INotification) {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

/** Whether this is a platform-wide broadcast (no specific recipient) */
notificationSchema.virtual("isBroadcast").get(function (this: INotification) {
  return this.recipient === null;
});

// pre-save hooks

/**
 * Auto-set readAt timestamp the first time isRead flips to true.
 * Prevents overwriting a previously recorded readAt on subsequent saves.
 */
notificationSchema.pre("save", function (this: INotification) {
  if (this.isModified("isRead") && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
});

/**
 * Guard: broadcast notifications must not carry isRead = true on creation,
 * since they have no single recipient to attribute the read state to.
 * Broadcast read-state is tracked via dismissedBy instead.
 */
notificationSchema.pre("validate", function (this: INotification) {
  if (this.isNew && this.recipient === null && this.isRead) {
    this.invalidate(
      "isRead",
      "Broadcast notifications cannot be marked as read on creation. Use dismissedBy instead."
    );
  }
});

// instance methods

/**
 * Mark this notification as read and persist.
 * Idempotent — calling it multiple times on an already-read notification
 * returns the document without an extra write.
 */
notificationSchema.methods.markAsRead = async function (
  this: INotification
): Promise<INotification> {
  if (this.isRead) return this;
  this.isRead = true;
  // readAt is set by the pre-save hook
  return this.save({ validateBeforeSave: false });
};

// static methods

export interface INotificationModel extends mongoose.Model<INotification> {
  /**
   * Fetch the unread notification count for a user.
   * Includes both personal notifications and broadcast notifications
   * the user has not yet dismissed.
   */
  getUnreadCount(userId: Types.ObjectId): Promise<number>;

  /**
   * Mark all unread personal notifications for a user as read in a single
   * bulk write. Returns the number of documents updated.
   */
  markAllAsRead(userId: Types.ObjectId): Promise<number>;

  /**
   * Record that a user dismissed a broadcast notification.
   * No-ops gracefully if already dismissed.
   */
  dismissBroadcast(
    notificationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void>;

  /**
   * Retrieve active broadcast notifications not yet dismissed by the user,
   * sorted newest first.
   */
  getActiveBroadcasts(userId: Types.ObjectId): Promise<INotification[]>;
}

notificationSchema.statics.getUnreadCount = async function (
  userId: Types.ObjectId
): Promise<number> {
  const [personal, broadcast] = await Promise.all([
    // Personal unread
    this.countDocuments({ recipient: userId, isRead: false }),
    // Broadcast not yet dismissed by this user
    this.countDocuments({
      recipient: null,
      dismissedBy: { $ne: userId },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }),
  ]);
  return personal + broadcast;
};

notificationSchema.statics.markAllAsRead = async function (
  userId: Types.ObjectId
): Promise<number> {
  const result = await this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

notificationSchema.statics.dismissBroadcast = async function (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<void> {
  await this.updateOne(
    { _id: notificationId, recipient: null },
    { $addToSet: { dismissedBy: userId } }
  );
};

notificationSchema.statics.getActiveBroadcasts = async function (
  userId: Types.ObjectId
): Promise<INotification[]> {
  return this.find({
    recipient: null,
    dismissedBy: { $ne: userId },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .lean();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
