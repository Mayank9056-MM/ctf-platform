import mongoose, { Types, Document } from "mongoose";

// emums

/**
 * Every discrete action the platform can record.
 *
 * Convention: <resource>:<verb>
 * Resources  : auth | user | team | challenge | submission | announcement |
 *              notification | admin
 * Verbs      : create | update | delete | publish | retract | ban | unban |
 *              login | logout | invite | join | leave | kick | solve | attempt |
 *              purchase | dispatch | archive | restore
 */
export const AuditAction = {
  // Auth
  AUTH_LOGOUT: "auth:logout",
  AUTH_REGISTER: "auth:register",
  AUTH_PASSWORD_RESET_REQUEST: "auth:password_reset_request",
  AUTH_PASSWORD_RESET: "auth:password_reset",
  AUTH_EMAIL_VERIFY: "auth:email_verify",
  AUTH_TOKEN_REFRESH: "auth:token_refresh",
  AUTH_OAUTH_LOGIN: "auth:oauth_login",

  // User
  USER_UPDATE_PROFILE: "user:update_profile",
  USER_UPDATE_PASSWORD: "user:update_password",
  USER_DELETE: "user:delete",
  USER_BAN: "user:ban",
  USER_UNBAN: "user:unban",
  USER_ROLE_CHANGE: "user:role_change",
  USER_SCORE_UPDATE: "user:score_update",

  // Team
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",
  TEAM_INVITE: "team:invite",
  TEAM_INVITE_ACCEPT: "team:invite_accept",
  TEAM_INVITE_DECLINE: "team:invite_decline",
  TEAM_MEMBER_KICK: "team:member_kick",
  TEAM_MEMBER_LEAVE: "team:member_leave",
  TEAM_JOIN_CODE_GENERATE: "team:join_code_generate",
  TEAM_JOIN: "team:join",

  // Challenge
  CHALLENGE_CREATE: "challenge:create",
  CHALLENGE_UPDATE: "challenge:update",
  CHALLENGE_DELETE: "challenge:delete",
  CHALLENGE_PUBLISH: "challenge:publish",
  CHALLENGE_ARCHIVE: "challenge:archive",
  CHALLENGE_RESTORE: "challenge:restore",
  CHALLENGE_HINT_ADD: "challenge:hint_add",
  CHALLENGE_HINT_REMOVE: "challenge:hint_remove",
  CHALLENGE_ATTACHMENT_ADD: "challenge:attachment_add",
  CHALLENGE_ATTACHMENT_REMOVE: "challenge:attachment_remove",

  // Submission
  SUBMISSION_ATTEMPT: "submission:attempt",
  SUBMISSION_CORRECT: "submission:correct",
  SUBMISSION_FIRST_BLOOD: "submission:first_blood",
  SUBMISSION_HINT_PURCHASE: "submission:hint_purchase",

  // Announcement
  ANNOUNCEMENT_CREATE: "announcement:create",
  ANNOUNCEMENT_UPDATE: "announcement:update",
  ANNOUNCEMENT_PUBLISH: "announcement:publish",
  ANNOUNCEMENT_RETRACT: "announcement:retract",
  ANNOUNCEMENT_DELETE: "announcement:delete",

  // Notification
  NOTIFICATION_DISPATCH: "notification:dispatch",
  NOTIFICATION_MARK_READ: "notification:mark_read",
  NOTIFICATION_MARK_ALL_READ: "notification:mark_all_read",

  // Admin
  ADMIN_SETTINGS_UPDATE: "admin:settings_update",
  ADMIN_SCOREBOARD_FREEZE: "admin:scoreboard_freeze",
  ADMIN_SCOREBOARD_UNFREEZE: "admin:scoreboard_unfreeze",
  ADMIN_EVENT_START: "admin:event_start",
  ADMIN_EVENT_END: "admin:event_end",
  ADMIN_BULK_RESET_SCORES: "admin:bulk_reset_scores",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Outcome of the audited operation.
 *
 *  success  → completed without error
 *  failure  → application-level rejection (validation, auth, business rule)
 *  error    → unexpected server-side exception
 */
export type AuditOutcome = "success" | "failure" | "error";

/**
 * Who / what initiated the action.
 *
 *  user   → authenticated human actor
 *  admin  → privileged human actor (role: admin | superadmin)
 *  system → background job, cron, or internal service call (no human actor)
 */
export type AuditActorType = "user" | "admin" | "system";

// sub-document interface

/**
 * Snapshot of the actor at the time of the event.
 * Stored inline so the log remains accurate even after account deletion.
 */
export interface IAuditActor {
  /** Null only for system-initiated actions */
  userId: Types.ObjectId | null;

  /** Username snapshot — not a live reference */
  username: string | null;
  role: string | null;
  type: AuditActorType;
}

/**
 * The resource the action was performed on.
 * At least one of id / collection must be present for non-system actions.
 */
export interface IAuditTarget {
  /** MongoDB ObjectId of the affected document */
  id?: Types.ObjectId;
  /** Mongoose model / collection name, e.g. "Challenge", "User" */
  collection?: string;
  /**
   * Human-readable label snapshot, e.g. challenge title or username.
   * Useful when the document may later be deleted.
   */
  label?: string;
}

/**
 * Request-level metadata for traceability.
 */
export interface IAuditRequestMeta {
  ipAddress?: string;
  userAgent?: string;
  /** X-Request-ID or equivalent correlation header */
  requestId?: string;
  /** REST method + path, e.g. "POST /api/v1/challenges" */
  endpoint?: string;
}

/**
 * Before / after value snapshots for update operations.
 * Only store what changed — not the entire document.
 * Values are typed as unknown so callers can pass any serialisable shape.
 */
export interface IAuditDiff {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  /** Explicit list of field names that changed, for quick filtering */
  changedFields?: string[];
}

export interface IAuditLog extends Document {
  action: AuditActionValue;
  outcome: AuditOutcome;

  actor: IAuditActor;
  target: IAuditTarget;

  /** Selective before/after diff for update-class actions */
  diff?: IAuditDiff;

  /** HTTP / job request metadata */
  request: IAuditRequestMeta;

  /**
   * Human-readable summary auto-generated by the pre-save hook.
   * Example: "admin johndoe published challenge 'SQLi 101'"
   */
  summary: string;

  /**
   * Error message when outcome === "error" | "failure".
   * Never stores a full stack trace — use your APM tool for that.
   */
  errorMessage?: string;

  /**
   * Arbitrary key-value bag for action-specific context that doesn't
   * fit the structured fields above.
   * e.g. { pointsAwarded: 500, isFirstBlood: true }
   */
  metadata: Record<string, unknown>;

  /**
   * Retention expiry. The TTL index deletes the document after this date.
   * Default: 90 days from creation. Set longer for compliance-sensitive actions.
   */
  expiresAt: Date;

  createdAt: Date;
}

const auditActorSchema = new mongoose.Schema<IAuditActor>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    username: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: {
        values: ["user", "admin", "system"] satisfies AuditActorType[],
        message: "Invalid actor type: {VALUE}",
      },
      required: [true, "Audit actor type is required"],
    },
  },
  { _id: false }
);

const auditTargetSchema = new mongoose.Schema<IAuditTarget>(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    collection: {
      type: String,
      trim: true,
      default: null,
    },
    label: {
      type: String,
      trim: true,
      maxlength: [200, "Target label cannot exceed 200 characters"],
      default: null,
    },
  },
  { _id: false }
);

const auditDiffSchema = new mongoose.Schema<IAuditDiff>(
  {
    before: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    after: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    changedFields: {
      type: [String],
      default: undefined,
    },
  },
  { _id: false }
);

const auditRequestMetaSchema = new mongoose.Schema<IAuditRequestMeta>(
  {
    ipAddress: {
      type: String,
      trim: true,
      default: undefined,
    },
    requestId: {
      type: String,
      trim: true,
      default: undefined,
    },
    endpoint: {
      type: String,
      trim: true,
      maxlength: [300, "Endpoint cannot exceed 300 characters"],
      default: undefined,
    },
  },
  { _id: false }
);

const DEFAULT_RETENTION_DAYS = 90;

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: [true, "Audit action is required"],
      enum: {
        values: Object.values(AuditAction),
        message: "Unknown audit action: {VALUE}",
      },
    },
    actor: {
      type: auditActorSchema,
      default: () => ({}),
    },
    diff: {
      type: auditDiffSchema,
      default: undefined,
    },
    request: {
      type: auditRequestMetaSchema,
      default: () => ({}),
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [1000, "Error message cannot exceed 1000 characters"],
      default: "",
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + 1000 * 60 * 60 * 24 * DEFAULT_RETENTION_DAYS),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes

// Admin audit trail: all actions by a specific user, newest first
auditLogSchema.index({ "actor.userId": 1, createdAt: -1 });

// Security dashboard: filter by action type and outcome
auditLogSchema.index({ action: 1, outcome: 1, createdAt: -1 });

// Per-resource history (e.g. "show all events for challenge X")
auditLogSchema.index({ "target.id": 1, createdAt: -1 });

// Collection-level sweep (e.g. "all user-related events")
auditLogSchema.index({ "target.collection": 1, action: 1, createdAt: -1 });

// IP-based forensics (brute force, suspicious submissions)
auditLogSchema.index({ "request.ipAddress": 1, createdAt: -1 });

// Global event feed sorted by time (admin dashboard)
auditLogSchema.index({ createdAt: -1 });

// TTL: auto-purge after expiresAt
auditLogSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "ttl_audit_expires_at" }
);

// virtuals

/** Convenience: did this action succeed? */
auditLogSchema.virtual("succeeded").get(function (this: IAuditLog) {
  return this.outcome === "success";
});

/** Resource prefix extracted from action string, e.g. "challenge" */
auditLogSchema.virtual("resource").get(function (this: IAuditLog) {
  return this.action.split(":")[0];
});

/** Verb extracted from action string, e.g. "publish" */
auditLogSchema.virtual("verb").get(function (this: IAuditLog) {
  return this.action.split(":")[1];
});

// pre-save hooks

/**
 * Auto-generate a human-readable summary if one was not provided.
 * Format: "<actorType> <username|system> <verb> <collection> <label>"
 * Example: "admin johndoe published challenge 'SQLi 101'"
 */
auditLogSchema.pre("save", function (this: IAuditLog) {
  if (this.summary) return;

  const who =
    this.actor.type === "system"
      ? "system"
      : `${this.actor.type} ${this.actor.username ?? this.actor.userId ?? "unknown"}`;

  const verb = this.action.split(":")[1]?.replace(/_/g, " ") ?? this.action;

  const what = [
    this.target.collection?.toLowerCase(),
    this.target.label ? `'${this.target.label}'` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const status = this.outcome !== "success" ? ` [${this.outcome}]` : "";

  this.summary = `${who} ${verb}${what ? ` ${what}` : ""}${status}`.trim();
});

/**
 * Immutability guard: audit logs must never be modified after creation.
 * Any attempt to save an existing document throws immediately.
 */
auditLogSchema.pre("save", function (this: IAuditLog) {
  if (!this.isNew) {
    throw new Error(
      "AuditLog documents are immutable. Create a new entry instead of modifying an existing one."
    );
  }
});

// static methods

export interface IAuditLogModel extends mongoose.Model<IAuditLog> {
  /**
   * Primary factory method. Use this instead of `new AuditLog()` to keep
   * service code concise and ensure all required fields are always present.
   */
  record(entry: {
    action: AuditActionValue;
    outcome: AuditOutcome;
    actor: IAuditActor;
    target?: Partial<IAuditTarget>;
    diff?: IAuditDiff;
    request?: Partial<IAuditRequestMeta>;
    metadata?: Record<string, unknown>;
    errorMessage?: string;
    /** Override the default 90-day retention */
    retentionDays?: number;
  }): Promise<IAuditLog>;

  /**
   * Fetch the full action history for a specific document (e.g. one challenge).
   */
  getResourceHistory(
    targetId: Types.ObjectId,
    limit?: number
  ): Promise<IAuditLog[]>;

  /**
   * Fetch all actions performed by a specific user, newest first.
   */
  getActorHistory(userId: Types.ObjectId, limit?: number): Promise<IAuditLog[]>;

  /**
   * Fetch all failed / errored actions within a rolling window.
   * Useful for the security dashboard and alerting pipelines.
   */
  getRecentFailures(windowMs?: number, limit?: number): Promise<IAuditLog[]>;

  /**
   * Fetch all events originating from an IP address.
   * Used for forensic investigation of suspicious activity.
   */
  getByIp(ipAddress: string, limit?: number): Promise<IAuditLog[]>;
}

auditLogSchema.statics.record = async function (entry: {
  action: AuditActionValue;
  outcome: AuditOutcome;
  actor: IAuditActor;
  target?: Partial<IAuditTarget>;
  diff?: IAuditDiff;
  request?: Partial<IAuditRequestMeta>;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  retentionDays?: number;
}): Promise<IAuditLog> {
  const retentionDays = entry.retentionDays ?? DEFAULT_RETENTION_DAYS;

  return this.create({
    action: entry.action,
    outcome: entry.outcome,
    actor: entry.actor,
    target: entry.target ?? {},
    diff: entry.diff,
    request: entry.request ?? {},
    metadata: entry.metadata ?? {},
    errorMessage: entry.errorMessage ?? undefined,
    expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
  });
};

auditLogSchema.statics.getResourceHistory = async function (
  targetId: Types.ObjectId,
  limit = 100
): Promise<IAuditLog[]> {
  return this.find({ "target.id": targetId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getActorHistory = async function (
  userId: Types.ObjectId,
  limit = 100
): Promise<IAuditLog[]> {
  return this.find({ "actor.userId": userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getRecentFailures = async function (
  windowMs = 60 * 60 * 1000, // 1 hour default
  limit = 200
): Promise<IAuditLog[]> {
  const since = new Date(Date.now() - windowMs);
  return this.find({
    outcome: { $in: ["failure", "error"] },
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getByIp = async function (
  ipAddress: string,
  limit = 200
): Promise<IAuditLog[]> {
  return this.find({ "request.ipAddress": ipAddress })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// model

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
