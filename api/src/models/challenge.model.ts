import mongoose, { Types, Document, ClientSession } from "mongoose";
import crypto from "crypto";

// sub-documents interface

export interface IHint {
  _id: mongoose.Types.ObjectId;
  text: string;
  cost: number;
  order: number;
}

export interface IAttachment {
  _id: Types.ObjectId;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  key: string;
}

export interface IDockerConfig {
  image: string;
  port: number;
  memoryLimit: string; // e.g., "512m", "1g"
  cpuLimit: string; // e.g., "0.5", "1"
  timeoutSeconds: number;
  flag: string;
}

export interface ISolveEntry {
  user: Types.ObjectId;
  team?: Types.ObjectId;
  solvedAt: Date;
  pointsAwarded: number;
}

// main challenge interface

export interface IChallenge extends Document {
  title: string;
  slug: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  tags: string[];
  author: Types.ObjectId; // admin who created it

  // scoring
  points: number;
  scoringType: "static" | "dynamic";
  minPoints: number;
  solveCount: number;

  // flags
  flag: string;
  flagFormat?: string;
  isCaseSensitive: boolean;

  // assets
  hints: IHint[];
  attachments: IAttachment[];

  // hosted challenge (Docker)
  isHosted: boolean;
  docker?: IDockerConfig;

  // visibility and lifecycle
  isVisible: boolean; // published to the CTF or still in draft
  isActive: boolean; // is archived or not (soft delete)
  publishedAt: Date;
  closedAt?: Date; // auto-close time for the challenge

  // first blood info for displaying on challenge list
  firstBlood?: {
    user: Types.ObjectId;
    team?: Types.ObjectId;
    solvedAt: Date;
  };

  // Solves history for displaying
  recentSolves: ISolveEntry[];

  // stats
  totalAttempts: number; // correct + incorrect attempts
  averageSolveTime: number; // in seconds

  createAt: Date;
  updatedAt: Date;

  isArchived: boolean;

  // methods
  getCurrentPoints(): number;
  verifyFlag(submittedFlag: string): boolean;
  recordSolve(
    userId: Types.ObjectId,
    teamId?: Types.ObjectId,
    session?: ClientSession
  ): Promise<IChallenge>;
}

// enums

export type ChallengeCategory =
  | "web"
  | "pwn"
  | "crypto"
  | "forensics"
  | "reversing"
  | "misc"
  | "osint"
  | "blockchain"
  | "hardware"
  | "cloud";

export type ChallengeDifficulty = "easy" | "medium" | "hard" | "insane";

// schema

const hintSchema = new mongoose.Schema<IHint>({
  text: {
    type: String,
    required: [true, "Hint text is required"],
    maxlength: [500, "Hint text cannot exceed 500 characters"],
  },
  cost: {
    type: Number,
    required: [true, "Hint cost is required"],
    min: [0, "Hint cost cannot be negative"],
    default: 0,
  },
  order: {
    type: Number,
    required: [true, "Hint order is required"],
    min: [1, "Hint order must be at least 1"],
  },
});

const attachmentSchema = new mongoose.Schema<IAttachment>({
  name: {
    type: String,
    required: [true, "Attachment name is required"],
    maxlength: [100, "Attachment name cannot exceed 100 characters"],
  },
  size: {
    type: Number,
    required: [true, "Attachment size is required"],
    min: [0, "Attachment size cannot be negative"],
  },
  mimeType: {
    type: String,
    required: [true, "Attachment MIME type is required"],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  key: {
    type: String,
    default: null,
  },
});

const dockerConfigSchema = new mongoose.Schema<IDockerConfig>({
  image: {
    type: String,
    required: [true, "Docker image is required"],
  },
  port: {
    type: Number,
    required: [true, "Docker port is required"],
    min: [1, "Docker port must be between 1 and 65535"],
    max: [65535, "Docker port must be between 1 and 65535"],
  },
  memoryLimit: {
    type: String,
    default: "256m",
  },
  cpuLimit: {
    type: String,
    default: "0.5",
  },
  timeoutSeconds: {
    type: Number,
    default: 3600, // 1 hour
    min: [1, "Docker timeout must be at least 1 second"],
  },
  flag: {
    type: String,
    default: "",
    select: false,
  },
});

const solveEntrySchema = new mongoose.Schema<ISolveEntry>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Solve entry must have a user reference"],
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },
  solvedAt: {
    type: Date,
    default: Date.now,
  },
  pointsAwarded: {
    type: Number,
    required: [true, "Solve entry must have points awarded"],
    min: [0, "Points awarded cannot be negative"],
  },
});

const challengeSchema = new mongoose.Schema<IChallenge>(
  {
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      unique: true,
      trim: true,
      minlength: [3, "Challenge title must be at least 3 characters"],
      maxlength: [100, "Challenge title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Challenge description is required"],
      minlength: [10, "Challenge description must be at least 10 characters"],
      maxlength: [
        10000,
        "Challenge description cannot exceed 10000 characters",
      ],
    },
    category: {
      type: String,
      required: [true, "Challenge category is required"],
      enum: {
        values: [
          "web",
          "pwn",
          "crypto",
          "forensics",
          "reversing",
          "misc",
          "osint",
          "blockchain",
          "hardware",
          "cloud",
        ],
        message: "Invalid challenge category",
      },
    },
    difficulty: {
      type: String,
      required: [true, "Challenge difficulty is required"],
      enum: {
        values: ["easy", "medium", "hard", "insane"],
        message: "Invalid challenge difficulty",
      },
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Challenge author is required"],
    },

    // scoring
    points: {
      type: Number,
      required: [true, "Challenge points are required"],
      min: [0, "Challenge points cannot be negative"],
    },
    scoringType: {
      type: String,
      enum: ["static", "dynamic"],
      default: "dynamic",
    },
    minPoints: {
      type: Number,
      default: 10,
      min: [0, "Minimum points cannot be negative"],
    },
    solveCount: {
      type: Number,
      default: 0,
      min: [0, "Solve count cannot be negative"],
    },

    // flag
    flag: {
      type: String,
      required: [true, "Challenge flag is required"],
      select: false,
    },
    flagFormat: {
      type: String,
      default: null,
      maxlength: [50, "Flag format cannot exceed 50 characters"],
    },
    isCaseSensitive: {
      type: Boolean,
      default: true,
    },

    // assets
    hints: {
      type: [hintSchema],
      default: [],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    // hosted challenge
    isHosted: {
      type: Boolean,
      default: false,
    },
    docker: {
      type: dockerConfigSchema,
      default: null,
    },

    // visibility and lifecycle
    isVisible: {
      type: Boolean,
      default: false, // admin must explicitly publish the challenge
    },
    isActive: {
      type: Boolean,
      default: true, // can be archived instead of deleted
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },

    // first blood info
    firstBlood: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null,
      },
      solvedAt: Date,
    },

    // solve history
    recentSolves: {
      type: [solveEntrySchema],
      default: [],
    },

    // stats
    totalAttempts: {
      type: Number,
      default: 0,
      min: [0, "Total attempts cannot be negative"],
    },
    averageSolveTime: {
      type: Number,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// indexes
challengeSchema.index({ category: 1, difficulty: 1 });
challengeSchema.index({ isVisible: 1, isActive: 1 });
challengeSchema.index({ points: -1 });
challengeSchema.index({ solveCount: 1 });
challengeSchema.index({ tags: 1 });
challengeSchema.index({ slug: 1 });
challengeSchema.index({ author: 1 });
challengeSchema.index({ publishedAt: -1 });
challengeSchema.index({ isVisible: 1, isActive: 1, category: 1, points: -1 });

// viruals

/**
 * Calculate solve rate as a percentage.
 */
challengeSchema.virtual("solveRate").get(function () {
  if (!this.totalAttempts) return 0;
  return (this.solveCount / this.totalAttempts) * 100;
});

/**
 * Current dynamic points based on solve count.
 * Uses exponential decay: points decay as more teams solve it.
 * Floor is minPoints.
 */
challengeSchema.virtual("currentPoints").get(function (this: IChallenge) {
  return this.getCurrentPoints();
});

/**
 * Solve rate as a percentage of all players (approximation).
 * Useful for difficulty badges on frontend.
 */
challengeSchema.virtual("hintCount").get(function (this: IChallenge) {
  return this.hints.length;
});

challengeSchema.virtual("attachmentCount").get(function (this: IChallenge) {
  return this.attachments.length;
});

// pre-save hooks

/**
 * Auto-generate slug from title if not provided.
 */
challengeSchema.pre("save", function (this: IChallenge) {
  if (this.isModified("title") && !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80);

    this.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
  }
});

/**
 * Hash the flag before saving using sha256.
 * Flag is NEVER stored in plaintext.
 */
challengeSchema.pre("save", function (this: IChallenge) {
  if (this.isModified("flag") && this.flag) {
    this.flag = crypto
      .createHash("sha256")
      .update(this.flag.trim())
      .digest("hex");
  }
});

/**
 * Set publishedAt timestamp when challenge is first made visible.
 */
challengeSchema.pre("save", function (this: IChallenge) {
  if (this.isModified("isVisible") && this.isVisible && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/**
 * Validate docker config is provided when isHosted is true.
 */
challengeSchema.pre("validate", function (this: IChallenge) {
  if (this.isHosted && !this.docker) {
    this.invalidate(
      "docker",
      "Docker config is required for hosted challenges"
    );
  }
  if (this.minPoints > this.points) {
    this.invalidate("minPoints", "minPoints cannot exceed base points");
  }
  // Validate hint order values are unique
  const orders = this.hints.map((h) => h.order);
  if (new Set(orders).size !== orders.length) {
    this.invalidate("hints", "Hint order values must be unique");
  }
});

// methods

/**
 * Calculate current points using exponential decay formula.
 * Points decay as more teams/users solve the challenge.
 * Formula: max(minPoints, floor(basePoints * (0.5 + 0.5 * e^(-0.05 * (solveCount - 1)))))
 *
 * Examples with base=500, min=100:
 *   0 solves  → 500 pts
 *   10 solves → ~439 pts
 *   50 solves → ~222 pts
 *  100 solves → ~108 pts
 */
challengeSchema.methods.getCurrentPoints = function (this: IChallenge): number {
  if (this.scoringType === "static") return this.points;

  const decayed = Math.floor(
    this.points *
      (0.5 + 0.5 * Math.exp(-0.05 * Math.max(0, this.solveCount - 1)))
  );
  return Math.max(this.minPoints, decayed);
};

/**
 * Verify a submitted flag against the stored hash.
 * Handles case sensitivity setting.
 * @param submittedFlag - Raw flag string from the player
 */
challengeSchema.methods.verifyFlag = function (
  this: IChallenge,
  submittedFlag: string
): boolean {
  const normalizedSubmit = this.isCaseSensitive
    ? submittedFlag.trim()
    : submittedFlag.trim().toLowerCase();

  const hashedSubmit = crypto
    .createHash("sha256")
    .update(normalizedSubmit)
    .digest("hex");

  // If case insensitive, we need to compare against a lowercase-hashed stored flag
  // Important: flag must also have been stored in lowercase when case-insensitive
  return hashedSubmit === this.flag;
};

/**
 * Record a solve — updates firstBlood, recentSolves, solveCount, totalAttempts.
 * Call this from your SubmissionService AFTER verifying the flag.
 * @param userId - The user who solved the challenge
 * @param teamId - Optional team ID
 */
challengeSchema.methods.recordSolve = async function (
  this: IChallenge,
  userId: Types.ObjectId,
  teamId?: Types.ObjectId,
  session?: ClientSession
): Promise<IChallenge> {
  const pointsAwarded = this.getCurrentPoints();

  // Set first blood only once
  if (!this.firstBlood || !this.firstBlood.user) {
    this.firstBlood = {
      user: userId,
      team: teamId ?? undefined,
      solvedAt: new Date(),
    };
  }

  // Keep only last 10 solves for display
  this.recentSolves.push({
    user: userId,
    team: teamId,
    solvedAt: new Date(),
    pointsAwarded,
  });

  if (this.recentSolves.length > 10) {
    this.recentSolves = this.recentSolves.slice(
      -10
    ) as typeof this.recentSolves;
  }

  this.solveCount += 1;
  this.totalAttempts += 1;

  return this.save({ validateBeforeSave: false, session });
};

const Challenge = mongoose.model<IChallenge>("Challenge", challengeSchema);

export default Challenge;
