import mongoose, { Document, Types } from "mongoose";

// Enums

/**
 * What the leaderboard ranks.
 *  global_user   → all-time user rankings across the entire platform
 *  global_team   → all-time team rankings
 *  event_user    → user rankings scoped to a single event
 *  event_team    → team rankings scoped to a single event
 */
export type LeaderboardScope =
  | "global_user"
  | "global_team"
  | "event_user"
  | "event_team";

// Sub-document

// Pure data shape
export interface Leaderboard {
  entries: ILeaderboardEntry[];
  totalCount: number;
  computedAt: Date;
  isStale: boolean;
  isFrozen?: boolean;
  frozenAt?: Date | null;
}

// Mongoose document
export interface ILeaderboardDocument extends Leaderboard, Document {}

export interface ILeaderboardEntry {
  /** 1-based rank */
  rank: number;

  /** ObjectId of the User or Team being ranked */
  entityId: Types.ObjectId;

  /** "user" or "team" — determines how entityId is populated */
  entityType: "user" | "team";

  /** Denormalised display fields — duplicated for read performance */
  username: string;
  avatar?: { url: string };
  country?: string;
  teamId?: Types.ObjectId;
  teamName?: string;

  /** Aggregated stats at snapshot time */
  score: number;
  solveCount: number;
  firstBloods: number;

  /** Timestamp of the last correct solve — used as a tiebreaker (faster = higher) */
  lastSolveAt?: Date;
}

// Main Interface

export interface ILeaderboard extends Document {
  scope: LeaderboardScope;

  /** For event_user / event_team scopes; null for global */
  eventId?: Types.ObjectId | null;

  /**
   * Pre-ranked entries sorted by score DESC, lastSolveAt ASC.
   * Stored as a top-N slice (e.g. top 500) to bound document size.
   * For full paginated access, query LeaderboardEntry collection instead.
   */
  entries: ILeaderboardEntry[];

  /** Total number of ranked participants (beyond the stored slice) */
  totalCount: number;

  /** Whether the scores are frozen at a point in time (event scoreboard freeze) */
  isFrozen: boolean;

  /** When the scoreboard was frozen */
  frozenAt?: Date | null;

  /** When this snapshot was last computed */
  computedAt: Date;

  /**
   * Soft stale flag — set to true when the service knows data has changed
   * but the recompute hasn't run yet. Lets the API signal clients.
   */
  isStale: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Schema

const leaderboardEntrySchema = new mongoose.Schema<ILeaderboardEntry>(
  {
    rank: {
      type: Number,
      required: true,
      min: [1, "Rank must be at least 1"],
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    entityType: {
      type: String,
      enum: ["user", "team"],
      required: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    avatar: {
      url: { type: String, default: null },
    },

    country: {
      type: String,
      maxlength: 2,
      default: null,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    teamName: {
      type: String,
      default: null,
    },

    score: {
      type: Number,
      required: true,
      default: 0,
    },

    solveCount: {
      type: Number,
      required: true,
      default: 0,
    },

    firstBloods: {
      type: Number,
      default: 0,
    },

    lastSolveAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false } // entries are embedded — no ObjectId per entry
);

const leaderboardSchema = new mongoose.Schema<ILeaderboard>(
  {
    scope: {
      type: String,
      required: [true, "scope is required"],
      enum: {
        values: [
          "global_user",
          "global_team",
          "event_user",
          "event_team",
        ] satisfies LeaderboardScope[],
        message: "Invalid leaderboard scope: {VALUE}",
      },
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },

    entries: {
      type: [leaderboardEntrySchema],
      default: [],
    },

    totalCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },

    frozenAt: {
      type: Date,
      default: null,
    },

    isStale: {
      type: Boolean,
      default: false,
    },

    computedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes

// Primary lookup: scope (+ optional eventId for event boards)
leaderboardSchema.index(
  { scope: 1, eventId: 1 },
  {
    unique: true,
    name: "unique_scope_event",
    partialFilterExpression: { eventId: { $ne: null } },
  }
);

// Global boards have no eventId
leaderboardSchema.index(
  { scope: 1 },
  {
    unique: true,
    name: "unique_global_scope",
    partialFilterExpression: { eventId: null },
  }
);

// Stale detection — for the recompute cron to find work
leaderboardSchema.index({ isStale: 1, computedAt: 1 });

// Virtuals

leaderboardSchema.virtual("ageSeconds").get(function (this: ILeaderboard) {
  return Math.floor((Date.now() - this.computedAt.getTime()) / 1000);
});

// Static Methods

export interface ILeaderboardModel extends mongoose.Model<ILeaderboard> {
  /**
   * Upsert a leaderboard document. Creates it if it doesn't exist.
   * The scope+eventId combination is the natural unique key.
   */
  upsertBoard(
    scope: LeaderboardScope,
    data: Partial<Leaderboard>,
    eventId?: Types.ObjectId
  ): Promise<ILeaderboard>;

  /**
   * Mark a leaderboard as stale. Called whenever a correct submission
   * lands so the next cron tick (or on-demand call) knows to recompute.
   */
  markStale(scope: LeaderboardScope, eventId?: Types.ObjectId): Promise<void>;

  /**
   * Find all stale leaderboards needing recomputation.
   */
  findStale(): Promise<ILeaderboard[]>;
}

/**
 * Upsert a leaderboard document. Creates it if it doesn't exist.
 * The scope+eventId combination is the natural unique key.
 * @param {LeaderboardScope} scope What the leaderboard ranks.
 * @param {Partial<ILeaderboard>} data Partial leaderboard object.
 * @param {Types.ObjectId} [eventId] Optional event ID for event-scoped boards.
 * @returns {Promise<ILeaderboard>} Resolves to the upserted document.
 */
leaderboardSchema.statics.upsertBoard = async function (
  scope: LeaderboardScope,
  data: Partial<ILeaderboard>,
  eventId?: Types.ObjectId
): Promise<ILeaderboard> {
  const filter: Record<string, unknown> = { scope };
  if (eventId) filter.eventId = eventId;
  else filter.eventId = null;

  return this.findOneAndUpdate(
    filter,
    {
      $set: {
        ...data,
        scope,
        eventId: eventId ?? null,
        isStale: false,
        computedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Mark a leaderboard as stale. Called whenever a correct submission
 * lands so the next cron tick (or on-demand call) knows to recompute.
 * @param {LeaderboardScope} scope What the leaderboard ranks.
 * @param {Types.ObjectId} [eventId] Optional event ID for event-scoped boards.
 * @returns {Promise<void>}
 */
leaderboardSchema.statics.markStale = async function (
  scope: LeaderboardScope,
  eventId?: Types.ObjectId
): Promise<void> {
  const filter: Record<string, unknown> = { scope };
  if (eventId) filter.eventId = eventId;
  else filter.eventId = null;

  await this.updateOne(filter, { $set: { isStale: true } }, { upsert: false });
};

/**
 * Find all stale leaderboards needing recomputation.
 * Returns a promise that resolves to an array of documents representing the stale leaderboards.
 */
leaderboardSchema.statics.findStale = async function (): Promise<
  ILeaderboard[]
> {
  return this.find({ isStale: true }).lean();
};

// Model

const Leaderboard = mongoose.model<ILeaderboard, ILeaderboardModel>(
  "Leaderboard",
  leaderboardSchema
);

export default Leaderboard;
