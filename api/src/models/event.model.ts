import mongoose, { Types, Document } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Lifecycle states an event moves through — strictly forward-only.
 *
 *  draft       → being configured by admins; invisible to participants
 *  scheduled   → fully configured, published, countdown visible
 *  active      → currently running; submissions accepted
 *  paused      → temporarily halted (e.g. infra issue); submissions blocked
 *  ended       → past closedAt or manually ended; submissions closed
 *  archived    → soft-deleted; hidden from all listings
 */
export type EventStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "archived";

/**
 * Valid forward-only status transitions.
 * Key = current status, value = allowed next statuses.
 */
export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ["scheduled", "archived"],
  scheduled: ["active", "draft", "archived"],
  active: ["paused", "ended"],
  paused: ["active", "ended"],
  ended: ["archived"],
  archived: [],
};

/**
 * CTF format / competition mode.
 *
 *  jeopardy      → classic category + points board
 *  attack_defense → teams run live services and attack each other
 *  king_of_hill   → continuous scoring based on flag hold time
 *  mixed          → admin-defined hybrid
 */
export type EventFormat =
  | "jeopardy"
  | "attack_defense"
  | "king_of_hill"
  | "mixed";

/**
 * Who can register and participate.
 *
 *  public     → open to anyone with an account
 *  invite     → require an invite code to register
 *  internal   → restricted to specific user / team list
 */
export type EventVisibility = "public" | "invite" | "internal";

//  Sub-document Interface

export interface IEventScoring {
  /**
   * Whether dynamic scoring (exponential decay) is globally enabled.
   * Overrides per-challenge scoringType when false.
   */
  dynamicScoring: boolean;

  /**
   * Bonus points awarded for first blood on any challenge.
   * Set to 0 to disable.
   */
  firstBloodBonus: number;

  /**
   * Penalty applied per incorrect submission when penaltyMode is active.
   * Stored as a positive integer; subtracted at service layer.
   */
  incorrectPenalty: number;

  /**
   * Maximum incorrect submissions allowed before a user is locked out
   * of a challenge. 0 = unlimited.
   */
  maxAttemptsPerChallenge: number;

  /**
   * Whether the scoreboard is currently frozen (hides real-time updates).
   * Admins typically freeze N minutes before the event ends.
   */
  scoreboardFrozen: boolean;

  /** Timestamp the scoreboard was frozen; null if not frozen */
  scoreboardFrozenAt?: Date;
}

export interface IEventRegistration {
  /** Whether participant registration is currently open */
  isOpen: boolean;

  /** Maximum number of registered participants (0 = unlimited) */
  maxParticipants: number;

  /** Maximum team size allowed for this event (1 = solo-only) */
  maxTeamSize: number;

  /** Whether solo (teamless) participation is permitted */
  allowSolo: boolean;

  /**
   * Invite code required when visibility === "invite".
   * Stored as a plain string; hashing is overkill for CTF invite codes.
   */
  inviteCode?: string;

  /** Explicit allowlist for visibility === "internal" */
  allowedUsers: Types.ObjectId[];
  allowedTeams: Types.ObjectId[];

  /**
   * Registration deadline. Null = open until event ends.
   * Must be ≤ event closedAt.
   */
  registrationClosesAt?: Date;
}

export interface IEventBranding {
  /** Short tagline shown beneath the event title */
  tagline?: string;
  /** Full markdown description shown on the event landing page */
  description?: string;
  /** URL to banner / hero image */
  bannerUrl?: string;
  /** URL to event logo / icon */
  logoUrl?: string;
  /** Hex colour used for event-themed UI accents, e.g. "#ff4500" */
  accentColor?: string;
  /** Official website or info page */
  websiteUrl?: string;
}

export interface IEventStats {
  /** Total registered participants (denormalised counter) */
  registeredCount: number;
  /** Total registered teams */
  teamCount: number;
  /** Total correct solves across all challenges */
  totalSolves: number;
  /** Total submission attempts (correct + incorrect) */
  totalAttempts: number;
  /** Timestamp of the last stats refresh */
  lastRefreshedAt?: Date;
}

//  Main Interface

export interface IEvent extends Document {
  /** Unique display name of the event */
  name: string;

  /** URL-safe slug auto-generated from name */
  slug: string;

  format: EventFormat;
  status: EventStatus;
  visibility: EventVisibility;

  /** Admin users who created / manage this event */
  organizers: Types.ObjectId[];

  /** Challenges included in this event */
  challenges: Types.ObjectId[];

  /** Unix-based window — both required, opensAt must be < closedAt */
  opensAt: Date;
  closedAt: Date;

  scoring: IEventScoring;
  registration: IEventRegistration;
  branding: IEventBranding;
  stats: IEventStats;

  /**
   * Whether the platform should automatically transition status to "active"
   * at opensAt and to "ended" at closedAt.
   */
  autoTransition: boolean;

  /**
   * Timestamp the event was manually ended early by an admin (before closedAt).
   * Null if it ran to its natural end.
   */
  endedEarlyAt?: Date;

  /** Admin who ended the event early */
  endedEarlyBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  // Instance Methods

  /** True if the event is currently accepting submissions */
  isAcceptingSubmissions(): boolean;

  /** True if a given userId is an organizer */
  isOrganizer(userId: Types.ObjectId): boolean;

  // Virtuals
  durationMs: number;
  isWithinWindow: boolean;
  minutesRemaining: number;

  // Instance Methods
  isAcceptingSubmissions(): boolean;
  isOrganizer(userId: Types.ObjectId): boolean;

  /**
   * Transition to a new status, enforcing the allowed-transitions graph.
   * Throws if the transition is not permitted.
   */
  transitionTo(
    newStatus: EventStatus,
    actorId?: Types.ObjectId
  ): Promise<IEvent>;

  /** Freeze / unfreeze the scoreboard */
  setScoreboardFrozen(frozen: boolean): Promise<IEvent>;
}

// Schema

const eventScoringSchema = new mongoose.Schema<IEventScoring>(
  {
    dynamicScoring: { type: Boolean, default: true },
    firstBloodBonus: {
      type: Number,
      default: 0,
      min: [0, "First blood bonus cannot be negative"],
    },
    incorrectPenalty: {
      type: Number,
      default: 0,
      min: [0, "Penalty cannot be negative"],
    },
    maxAttemptsPerChallenge: {
      type: Number,
      default: 0,
      min: [0, "Max attempts cannot be negative"],
    },
    scoreboardFrozen: { type: Boolean, default: false },
    scoreboardFrozenAt: { type: Date, default: null },
  },
  { _id: false }
);

const eventRegistrationSchema = new mongoose.Schema<IEventRegistration>(
  {
    isOpen: { type: Boolean, default: true },
    maxParticipants: {
      type: Number,
      default: 0,
      min: [0, "maxParticipants cannot be negative"],
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      min: [1, "maxTeamSize must be at least 1"],
      max: [10, "maxTeamSize cannot exceed 10"],
    },
    allowSolo: { type: Boolean, default: true },
    inviteCode: { type: String, trim: true, default: null },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    allowedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    registrationClosesAt: { type: Date, default: null },
  },
  { _id: false }
);

const eventBrandingSchema = new mongoose.Schema<IEventBranding>(
  {
    tagline: {
      type: String,
      trim: true,
      maxlength: [160, "Tagline cannot exceed 160 characters"],
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [10000, "Description cannot exceed 10 000 characters"],
      default: null,
    },
    bannerUrl: { type: String, trim: true, default: null },
    logoUrl: { type: String, trim: true, default: null },
    accentColor: {
      type: String,
      trim: true,
      match: [
        /^#[0-9a-fA-F]{6}$/,
        "accentColor must be a valid hex colour, e.g. #ff4500",
      ],
      default: null,
    },
    websiteUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Website URL cannot exceed 500 characters"],
      default: null,
    },
  },
  { _id: false }
);

const eventStatsSchema = new mongoose.Schema<IEventStats>(
  {
    registeredCount: { type: Number, default: 0, min: 0 },
    teamCount: { type: Number, default: 0, min: 0 },
    totalSolves: { type: Number, default: 0, min: 0 },
    totalAttempts: { type: Number, default: 0, min: 0 },
    lastRefreshedAt: { type: Date, default: null },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Event name must be at least 3 characters"],
      maxlength: [100, "Event name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    format: {
      type: String,
      required: [true, "Event format is required"],
      enum: {
        values: [
          "jeopardy",
          "attack_defense",
          "king_of_hill",
          "mixed",
        ] satisfies EventFormat[],
        message: "Invalid event format: {VALUE}",
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "scheduled",
          "active",
          "paused",
          "ended",
          "archived",
        ] satisfies EventStatus[],
        message: "Invalid event status: {VALUE}",
      },
      default: "draft",
    },
    visibility: {
      type: String,
      enum: {
        values: ["public", "invite", "internal"] satisfies EventVisibility[],
        message: "Invalid visibility: {VALUE}",
      },
      default: "public",
    },
    organizers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length >= 1,
        message: "An event must have at least one organizer",
      },
    },
    challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Challenge" }],
    opensAt: {
      type: Date,
      required: [true, "Event start time is required"],
    },
    closedAt: {
      type: Date,
      required: [true, "Event end time is required"],
    },
    scoring: { type: eventScoringSchema, default: () => ({}) },
    registration: { type: eventRegistrationSchema, default: () => ({}) },
    branding: { type: eventBrandingSchema, default: () => ({}) },
    stats: { type: eventStatsSchema, default: () => ({}) },
    autoTransition: { type: Boolean, default: true },
    endedEarlyAt: { type: Date, default: null },
    endedEarlyBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes

// Public listing: active / scheduled events
eventSchema.index({ status: 1, opensAt: 1 });

// Slug lookup (public URLs)
eventSchema.index({ slug: 1 });

// Organizer dashboard
eventSchema.index({ organizers: 1, status: 1 });

// Chronological admin overview
eventSchema.index({ opensAt: -1, closedAt: -1 });

// Auto-transition job: find events that should flip status at a given time
eventSchema.index({ autoTransition: 1, status: 1, opensAt: 1, closedAt: 1 });

// Invite-only lookup by code
eventSchema.index(
  { "registration.inviteCode": 1 },
  {
    sparse: true,
    name: "invite_code_lookup",
  }
);

// Virtuals

/** Duration of the event in milliseconds */
eventSchema.virtual("durationMs").get(function (this: IEvent) {
  return this.closedAt.getTime() - this.opensAt.getTime();
});

/** Whether the current wall-clock time falls within the event window */
eventSchema.virtual("isWithinWindow").get(function (this: IEvent) {
  const now = Date.now();
  return now >= this.opensAt.getTime() && now <= this.closedAt.getTime();
});

/** Minutes remaining until the event closes; 0 if already ended */
eventSchema.virtual("minutesRemaining").get(function (this: IEvent) {
  const remaining = this.closedAt.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 60_000));
});

// Pre-save Hooks

/** Auto-generate slug from name on first save */
eventSchema.pre("save", function (this: IEvent) {
  if (this.isModified("name") && !this.slug) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80);

    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
});

/**
 * Temporal integrity: opensAt must be strictly before closedAt.
 * registrationClosesAt (if set) must not exceed closedAt.
 */
eventSchema.pre("validate", function (this: IEvent) {
  if (this.opensAt && this.closedAt && this.opensAt >= this.closedAt) {
    this.invalidate("closedAt", "closedAt must be after opensAt");
  }

  const regClose = this.registration?.registrationClosesAt;
  if (regClose && this.closedAt && regClose > this.closedAt) {
    this.invalidate(
      "registration.registrationClosesAt",
      "registrationClosesAt cannot be after the event closedAt"
    );
  }
});

/**
 * Invite-code requirement: visibility === "invite" must carry an inviteCode.
 * Internal events must have at least one allowed user or team.
 */
eventSchema.pre("validate", function (this: IEvent) {
  if (this.visibility === "invite" && !this.registration?.inviteCode) {
    this.invalidate(
      "registration.inviteCode",
      'An invite code is required when visibility is "invite"'
    );
  }

  if (
    this.visibility === "internal" &&
    this.registration?.allowedUsers.length === 0 &&
    this.registration?.allowedTeams.length === 0
  ) {
    this.invalidate(
      "registration.allowedUsers",
      'At least one allowedUser or allowedTeam is required when visibility is "internal"'
    );
  }
});

/**
 * Freeze timestamp: stamp scoreboardFrozenAt when freeze is toggled on,
 * clear it when toggled off.
 */
eventSchema.pre("save", function (this: IEvent) {
  if (!this.isModified("scoring.scoreboardFrozen")) return;

  if (this.scoring.scoreboardFrozen && !this.scoring.scoreboardFrozenAt) {
    this.scoring.scoreboardFrozenAt = new Date();
  }
  if (!this.scoring.scoreboardFrozen) {
    this.scoring.scoreboardFrozenAt = undefined;
  }
});

// Instance Methods

eventSchema.methods.isAcceptingSubmissions = function (this: IEvent): boolean {
  return this.status === "active" && this.isWithinWindow;
};

eventSchema.methods.isOrganizer = function (
  this: IEvent,
  userId: Types.ObjectId
): boolean {
  return this.organizers.some((id) => id.toString() === userId.toString());
};

eventSchema.methods.transitionTo = async function (
  this: IEvent,
  newStatus: EventStatus,
  actorId?: Types.ObjectId
): Promise<IEvent> {
  const allowed = EVENT_STATUS_TRANSITIONS[this.status];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: "${this.status}" → "${newStatus}". ` +
        `Allowed: [${allowed.join(", ") || "none"}]`
    );
  }

  // Record early-end metadata when an active event is manually ended
  if (
    newStatus === "ended" &&
    this.status === "active" &&
    Date.now() < this.closedAt.getTime()
  ) {
    this.endedEarlyAt = new Date();
    if (actorId) this.endedEarlyBy = actorId;
  }

  this.status = newStatus;
  return this.save();
};

eventSchema.methods.setScoreboardFrozen = async function (
  this: IEvent,
  frozen: boolean
): Promise<IEvent> {
  if (this.status !== "active") {
    throw new Error("Scoreboard can only be frozen while the event is active.");
  }
  this.scoring.scoreboardFrozen = frozen;
  // scoreboardFrozenAt stamped / cleared by pre-save hook
  return this.save({ validateBeforeSave: false });
};

// Static Methods

export interface IEventModel extends mongoose.Model<IEvent> {
  /**
   * Return all public-facing events in a given status,
   * sorted by opensAt ascending.
   */
  getByStatus(status: EventStatus): Promise<IEvent[]>;

  /**
   * Find events whose autoTransition is enabled and whose window
   * boundary has been crossed since the last cron tick.
   * Used by the scheduler to fire status transitions automatically.
   */
  getPendingAutoTransitions(): Promise<IEvent[]>;

  /**
   * Find all events an organizer manages.
   */
  getByOrganizer(userId: Types.ObjectId): Promise<IEvent[]>;

  /**
   * Atomically increment a stats counter by delta.
   * Prevents race conditions when multiple submissions land simultaneously.
   */
  incrementStat(
    eventId: Types.ObjectId,
    field: keyof Omit<IEventStats, "lastRefreshedAt">,
    delta?: number
  ): Promise<void>;
}

eventSchema.statics.getByStatus = async function (
  status: EventStatus
): Promise<IEvent[]> {
  return this.find({ status })
    .sort({ opensAt: 1 })
    .populate("organizers", "username avatar")
    .lean();
};

eventSchema.statics.getPendingAutoTransitions = async function (): Promise<
  IEvent[]
> {
  const now = new Date();

  return this.find({
    autoTransition: true,
    $or: [
      // Should become active
      { status: "scheduled", opensAt: { $lte: now } },
      // Should become ended
      { status: "active", closedAt: { $lte: now } },
    ],
  }).lean();
};

eventSchema.statics.getByOrganizer = async function (
  userId: Types.ObjectId
): Promise<IEvent[]> {
  return this.find({ organizers: userId }).sort({ opensAt: -1 }).lean();
};

eventSchema.statics.incrementStat = async function (
  eventId: Types.ObjectId,
  field: keyof Omit<IEventStats, "lastRefreshedAt">,
  delta = 1
): Promise<void> {
  await this.updateOne(
    { _id: eventId },
    {
      $inc: { [`stats.${field}`]: delta },
      $set: { "stats.lastRefreshedAt": new Date() },
    }
  );
};

// model

const Event = mongoose.model<IEvent, IEventModel>("Event", eventSchema);

export default Event;
