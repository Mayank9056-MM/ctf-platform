import mongoose, { Types, Document } from "mongoose";
import crypto from "crypto";

// sub-documents interface

export interface ISubmissionMeta {
  // ip address of the submitter
  ipAddress?: string;
  // user agent from req
  userAgent?: string;
  //time taken from challenge open to submission
  solveTimeSeconds?: number;
}

// main interface

export interface ISubmission extends Document {
  // The user who submitted the flag
  user: Types.ObjectId;

  // The challenge this submission for
  challenge: Types.ObjectId;

  // team the user is belong to at the time of submission (null if solo)
  team?: Types.ObjectId;

  // hash flag
  flagHash: string;

  // correct or not
  isCorrect: boolean;

  /**
   * Points awarded for this submission
   * 0 for incorrect submissions; positive integer for correct (dynamic scoring snapshot)
   */
  pointsAwarded: number;

  /**
   * Whether this was the first correct solve for this challenge globally (first blood)
   * Computed and set once when the submission is verified as correct
   */
  isFirstBlood: boolean;

  // Extra metadata: IP, user-agent, solve time
  meta: ISubmissionMeta;

  /**
   * Rate-limit / anti-bruteforce gaurd
   * Set to a future timestamp when a user is temporarily locked out
   */
  lockedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const submissionMetaSchema = new mongoose.Schema<ISubmissionMeta>(
  {
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      maxlength: [512, "User-Agent cannot exceed 512 characters"],
    },
    solveTimeSeconds: {
      type: Number,
      min: [0, "Solve time cannot be negative"],
      default: null,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema<ISubmission>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submission must belong to a user"],
      index: true,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: [true, "Submission must reference a challenge"],
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    flagHash: {
      type: String,
      required: [true, "Flag hash is required"],
      select: false,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: [0, "Points awarded cannot be negative"],
    },
    isFirstBlood: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: submissionMetaSchema,
      default: () => ({}),
    },
    lockedUntil: {
      type: Date,
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
submissionSchema.index({ user: 1, challenge: 1 });
submissionSchema.index(
  { user: 1, challenge: 1, isCorrect: 1 },
  {
    unique: true,
    partialFilterExpression: { isCorrect: true },
    name: "unique_correct_solve_per_user_challenge",
  }
);

// Leaderboard / scoreboard queries
submissionSchema.index({ isCorrect: 1, createdAt: 1 });

// Team-level solve history
submissionSchema.index({ team: 1, challenge: 1, isCorrect: 1 });

// First-blood queries
submissionSchema.index({ challenge: 1, isCorrect: 1, createdAt: 1 });

// Admin / analytics: all submissions for a challenge
submissionSchema.index({ challenge: 1, createdAt: -1 });

// Rate-limit enforcement: recent attempts per user
submissionSchema.index({ user: 1, createdAt: -1 });

// preventing team solving same challenge multiple times
submissionSchema.index(
  { team: 1, challenge: 1, isCorrect: 1 },
  {
    unique: true,
    partialFilterExpression: { isCorrect: true, team: { $ne: null } },
    name: "unique_correct_solve_per_team_challenge",
  }
);

// vituals

/** Convenience label for display purposes */
submissionSchema.virtual("status").get(function (this: ISubmission) {
  return this.isCorrect ? "correct" : "incorrect";
});

// pre save hooks

/**
 * Hash the raw flag before persisting.
 *
 * Callers should pass the raw flag string in the virtual `_rawFlag` field
 * (or hash it themselves before construction). If the document already
 * carries a valid 64-char hex hash, the hook is a no-op.
 *
 * We deliberately avoid storing the raw flag anywhere on the document.
 */
submissionSchema.pre(
  "save",
  function (this: ISubmission & { _rawFlag?: string }) {
    const raw: string | undefined = this._rawFlag;

    if (raw !== undefined) {
      this.flagHash = crypto
        .createHash("sha256")
        .update(raw.trim())
        .digest("hex");

      // Clear the transient field so it is never persisted
      delete this._rawFlag;
    }

    // Guard: flagHash must be a 64-char hex string
    if (!/^[a-f0-9]{64}$/.test(this.flagHash)) {
      throw new Error(
        "flagHash must be a SHA-256 hex digest (64 characters). " +
          "Pass the raw flag via _rawFlag or hash it before calling save()."
      );
    }
  }
);

// static methods

export interface ISubmissionModel extends mongoose.Model<ISubmission> {
  /**
   * Count incorrect submissions for a user on a challenge within a rolling window.
   * Used by the submission service to enforce rate-limiting before processing
   * a new attempt.
   *
   * @param userId      - ObjectId of the submitting user
   * @param challengeId - ObjectId of the target challenge
   * @param windowMs    - Rolling window in milliseconds (default: 60_000 = 1 min)
   */
  countRecentFailures(
    userId: Types.ObjectId,
    challengeId: Types.ObjectId,
    windowMs?: number
  ): Promise<number>;

  /**
   * Retrieve all correct submissions for a challenge, sorted oldest-first.
   * Primarily used for leaderboard / first-blood display.
   */
  getCorrectSolves(challengeId: Types.ObjectId): Promise<ISubmission[]>;

  /**
   * Fetch a user's full submission history for a challenge (correct + incorrect),
   * newest first.
   */
  getHistory(
    userId: Types.ObjectId,
    challengeId: Types.ObjectId
  ): Promise<ISubmission[]>;
}

/**
 * Count the number of incorrect submissions a user has made for a given challenge
 * within a rolling window of time.
 *
 * @param {Types.ObjectId} userId - The ObjectId of the user whose recent attempts to count.
 * @param {Types.ObjectId} challengeId - The ObjectId of the challenge whose recent attempts to count.
 * @param {number} [windowMs=60_000] - The length of the rolling window in milliseconds (default: 1 minute).
 * @returns {Promise<number>} - A promise which resolves to the number of incorrect submissions within the given window.
 */
submissionSchema.statics.countRecentFailures = async function (
  userId: Types.ObjectId,
  challengeId: Types.ObjectId,
  windowMs = 60_000
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  return this.countDocuments({
    user: userId,
    challenge: challengeId,
    isCorrect: false,
    createdAt: { $gte: since },
  });
};

/**
 * Retrieve all correct submissions for a challenge, sorted oldest-first.
 * Primarily used for leaderboard / first-blood display.
 * @param {Types.ObjectId} challengeId - The challenge to fetch correct submissions for.
 * @returns {Promise<ISubmission[]>} - A promise which resolves to an array of correct submissions.
 */
submissionSchema.statics.getCorrectSolves = async function (
  challengeId: Types.ObjectId
): Promise<ISubmission[]> {
  return this.find({ challenge: challengeId, isCorrect: true })
    .sort({ createdAt: 1 })
    .populate("user", "username avatar")
    .populate("team", "name avatar")
    .lean();
};

/**
 * Fetch a user's full submission history for a challenge (correct + incorrect),
 * newest first.
 *
 * @param {Types.ObjectId} userId - The user to fetch submission history for.
 * @param {Types.ObjectId} challengeId - The challenge to fetch submission history for.
 * @returns {Promise<ISubmission[]>} - A promise which resolves to an array of submissions.
 */
submissionSchema.statics.getHistory = async function (
  userId: Types.ObjectId,
  challengeId: Types.ObjectId
): Promise<ISubmission[]> {
  return this.find({ user: userId, challenge: challengeId })
    .sort({ createdAt: -1 })
    .lean();
};

const Submission = mongoose.model<ISubmission, ISubmissionModel>(
  "Submission",
  submissionSchema
);

export default Submission;
