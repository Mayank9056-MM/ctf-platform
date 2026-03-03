import mongoose, { Types, Document } from "mongoose";

// enums

/**
 * Severity / visual weight of an announcement.
 * Maps to a colour/icon treatment on the frontend.
 *
 *  info     → neutral informational banner  (blue)
 *  success  → positive event                (green)
 *  warning  → something participants should note (amber)
 *  critical → urgent / requires action      (red)
 */
export type AnnouncementSeverity = "info" | "success" | "warning" | "critical";

/**
 * Audience scope.
 *
 *  all       → every authenticated user
 *  teams     → only users who belong to a team
 *  solo      → only users without a team
 *  specific  → an explicit list of user IDs (targeted blast)
 */
export type AnnouncementAudience = "all" | "teams" | "solo" | "specific";

export interface IAnnouncement extends Document {
  /** Short headline shown in notification badges / list views */
  title: string;

  /** Full rich body. Plain text; markdown rendering is a client concern. */
  body: string;

  severity: AnnouncementSeverity;

  /** Admin user who authored this announcement */
  author: Types.ObjectId;

  /**
   * Whether the announcement is live and visible to participants.
   * Admins can draft announcements before publishing.
   */
  isPublished: boolean;

  /** Timestamp the announcement was made visible; set automatically on publish */
  publishedAt?: Date;

  /**
   * Hard expiry — announcement stops rendering after this time.
   * TTL index removes the document from the collection automatically.
   * Null = never expires.
   */
  expiresAt?: Date;

  /**
   * Optional deep-link shown as a CTA button on the frontend.
   * e.g. "/challenges/crypto/rsa-warmup-abc123"
   */
  actionUrl?: string;

  /** Human-readable label for the actionUrl button */
  actionLabel?: string;

  /**
   * Related challenge, if this announcement is scoped to one
   * (e.g. "Hint released for Binary Exploitation #2").
   */
  challenge?: Types.ObjectId;

  audience: AnnouncementAudience;

  /**
   * Populated only when audience === "specific".
   * The notification service fans this out; the model just stores the target list.
   */
  targetUsers: Types.ObjectId[];

  /**
   * Users who have explicitly dismissed / acknowledged this announcement.
   * Keeps read-state without duplicating the document per user.
   */
  dismissedBy: Types.ObjectId[];

  /**
   * Whether a push notification / in-app notification was also emitted
   * when this announcement was published. Tracked for idempotency so
   * the notification job does not double-fire on retries.
   */
  notificationDispatched: boolean;

  /** Soft-delete flag — admins can retract without destroying the audit trail */
  isRetracted: boolean;

  /** Reason for retraction, recorded for the audit log */
  retractionReason?: string;

  createdAt: Date;
  updatedAt: Date;

  // instance methods
  publish(): Promise<IAnnouncement>;
  retract(reason?: string): Promise<IAnnouncement>;
  dismiss(userId: Types.ObjectId): Promise<void>;

  // virtuals
  isExpired: boolean;
  isLive: boolean;
  dismissCount: number;
}

const announcementSchema = new mongoose.Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    body: {
      type: String,
      required: [true, "Announcement body is required"],
      trim: true,
      maxlength: [5000, "Body cannot exceed 5000 characters"],
    },
    severity: {
      type: String,
      enum: {
        values: [
          "info",
          "success",
          "warning",
          "critical",
        ] satisfies AnnouncementSeverity[],
        message: "Invalid severity: {VALUE}",
      },
      default: "info",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Announcement must have an author"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Action URL cannot exceed 500 characters"],
      default: null,
    },
    actionLabel: {
      type: String,
      trim: true,
      maxlength: [60, "Action label cannot exceed 60 characters"],
      default: null,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
    audience: {
      type: String,
      enum: {
        values: [
          "all",
          "teams",
          "solo",
          "specific",
        ] satisfies AnnouncementAudience[],
        message: "Invalid audience: {VALUE}",
      },
      default: "all",
    },
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notificationDispatched: {
      type: Boolean,
      default: false,
    },
    isRetracted: {
      type: Boolean,
      default: false,
    },
    retractionReason: {
      type: String,
      trim: true,
      maxlength: [300, "Retraction reason cannot exceed 300 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes

// Primary feed query: published, non-retracted announcements newest-first
announcementSchema.index({ isPublished: 1, isRetracted: 1, publishedAt: -1 });

// Severity filter (e.g. "show only critical banners")
announcementSchema.index({ isPublished: 1, severity: 1, publishedAt: -1 });

// Challenge-scoped announcements (e.g. hint released)
announcementSchema.index({ challenge: 1, isPublished: 1 });

// Admin dashboard: all announcements by a specific author
announcementSchema.index({ author: 1, createdAt: -1 });

// Targeted audience lookup
announcementSchema.index({ audience: 1, isPublished: 1 });

// Pending notification dispatch job
announcementSchema.index({ isPublished: 1, notificationDispatched: 1 });

// TTL: MongoDB auto-deletes expired announcements (sparse = nulls excluded)
announcementSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, sparse: true, name: "ttl_expires_at" }
);

// vituals

/** True if expiresAt has passed, even before the TTL sweep runs */
announcementSchema.virtual("isExpired").get(function (this: IAnnouncement) {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

/** Convenience: is this announcement visible to participants right now? */
announcementSchema.virtual("isLive").get(function (this: IAnnouncement) {
  return this.isPublished && !this.isRetracted && !this.isExpired;
});

/** Number of users who have dismissed this announcement */
announcementSchema.virtual("dismissCount").get(function (this: IAnnouncement) {
  return this.dismissedBy?.length ?? 0;
});

// pre-save hooks

/**
 * Auto-stamp expiresAt the first time isPublished flips to true.
 * Never overwritten — preserves the original expiration timestamp even
 * if an admin toggles visibility off and on again.
 */
announcementSchema.pre("save", function (this: IAnnouncement) {
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/**
 * Audience integrity: targetUsers must be non-empty when audience is "specific".
 * Clear targetUsers for any other audience to avoid stale data.
 */
announcementSchema.pre("validate", function (this: IAnnouncement) {
  if (this.audience === "specific" && this.targetUsers.length === 0) {
    this.invalidate(
      "targetUsers",
      'targetUsers must contain at least one user ID when audience is "specific"'
    );
  }

  if (this.audience !== "specific" && this.targetUsers.length > 0) {
    this.targetUsers = [] as unknown as Types.ObjectId[];
  }
});

/**
 * actionUrl and actionLabel must be provided together.
 * A label without a URL (or vice-versa) is a misconfiguration.
 */
announcementSchema.pre("validate", function (this: IAnnouncement) {
  const hasUrl = Boolean(this.actionUrl);
  const hasLabel = Boolean(this.actionLabel);

  if (hasUrl && !hasLabel) {
    this.invalidate(
      "actionLabel",
      "actionLabel is required when actionUrl is set"
    );
  }
  if (hasLabel && !hasUrl) {
    this.invalidate(
      "actionUrl",
      "actionUrl is required when actionLabel is set"
    );
  }
});

/**
 * Guard: a retracted announcement cannot be re-published.
 */
announcementSchema.pre("save", function (this: IAnnouncement) {
  if (this.isRetracted && this.isModified("isPublished") && this.isPublished) {
    throw new Error("A retracted announcement cannot be re-published.");
  }
});

// Instance methods

announcementSchema.methods.publish = async function (
  this: IAnnouncement
): Promise<IAnnouncement> {
  if (this.isRetracted)
    throw new Error("Cannot publish a retracted announcement.");
  if (this.isPublished) return this;
  this.isPublished = true;
  // publishedAt stamped by pre-save hook
  return this.save();
};

announcementSchema.methods.retract = async function (
  this: IAnnouncement,
  reason?: string
): Promise<IAnnouncement> {
  this.isRetracted = true;
  this.isPublished = false;
  if (reason) this.retractionReason = reason;
  return this.save({ validateBeforeSave: false });
};

announcementSchema.methods.dismiss = async function (
  this: IAnnouncement,
  userId: Types.ObjectId
): Promise<void> {
  await (this.constructor as IAnnouncementModel).updateOne(
    { _id: this._id },
    { $addToSet: { dismissedBy: userId } }
  );
};

// static methods

export interface IAnnouncementModel extends mongoose.Model<IAnnouncement> {
  /**
   * Fetch the live announcement feed for a participant.
   * Excludes expired, retracted, and already-dismissed entries.
   * Ordered by severity weight (critical first) then publishedAt descending.
   *
   * @param userId  - The requesting user's ObjectId
   * @param hasTeam - Whether the user currently belongs to a team
   */
  getFeed(userId: Types.ObjectId, hasTeam: boolean): Promise<IAnnouncement[]>;

  /**
   * Return all announcements tied to a specific challenge, live only.
   */
  getForChallenge(challengeId: Types.ObjectId): Promise<IAnnouncement[]>;

  /**
   * Return published announcements that have not yet had their notification
   * dispatched. Used by the background notification job.
   */
  getPendingDispatch(): Promise<IAnnouncement[]>;

  /**
   * Mark a batch of announcements as dispatched in one bulk write.
   */
  markDispatched(ids: Types.ObjectId[]): Promise<void>;
}

const SEVERITY_WEIGHT: Record<AnnouncementSeverity, number> = {
  critical: 4,
  warning: 3,
  success: 2,
  info: 1,
};

announcementSchema.statics.getFeed = async function (
  userId: Types.ObjectId,
  hasTeam: boolean
): Promise<IAnnouncement[]> {
  const audienceFilter = {
    $or: [
      { audience: "all" },
      { audience: hasTeam ? "teams" : "solo" },
      { audience: "specific", targetUsers: userId },
    ],
  };

  const docs = await this.find({
    isPublished: true,
    isRetracted: false,
    dismissedBy: { $ne: userId },
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
      audienceFilter,
    ],
  })
    .populate("author", "username avatar")
    .populate("challenge", "title slug category")
    .lean();

  // Sort: critical → warning → success → info, then newest-first within tier
  return docs.sort((a: IAnnouncement, b: IAnnouncement) => {
    const sw =
      SEVERITY_WEIGHT[b.severity as AnnouncementSeverity] -
      SEVERITY_WEIGHT[a.severity as AnnouncementSeverity];

    if (sw !== 0) return sw;

    return (
      new Date(b.publishedAt ?? b.createdAt).getTime() -
      new Date(a.publishedAt ?? a.createdAt).getTime()
    );
  });
};

announcementSchema.statics.getForChallenge = async function (
  challengeId: Types.ObjectId
): Promise<IAnnouncement[]> {
  return this.find({
    challenge: challengeId,
    isPublished: true,
    isRetracted: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ publishedAt: -1 })
    .lean();
};

announcementSchema.statics.getPendingDispatch = async function (): Promise<
  IAnnouncement[]
> {
  return this.find({
    isPublished: true,
    isRetracted: false,
    notificationDispatched: false,
  }).lean();
};

announcementSchema.statics.markDispatched = async function (
  ids: Types.ObjectId[]
): Promise<void> {
  await this.updateMany(
    { _id: { $in: ids } },
    { $set: { notificationDispatched: true } }
  );
};

const Announcement = mongoose.model<IAnnouncement, IAnnouncementModel>(
  "Announcement",
  announcementSchema
);

export default Announcement;
