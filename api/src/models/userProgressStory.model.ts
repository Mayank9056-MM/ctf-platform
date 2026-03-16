import mongoose, { Types, Document } from "mongoose";

// Enums

export type StoryProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "abandoned";

// sub docuement interfaces

export interface ICompletedNode {
  nodeId: Types.ObjectId;

  /** The Challenge _id that was solved (null for cutscene/briefing nodes) */
  challengeId?: Types.ObjectId;
  completedAt: Date;

  /** Points earned from the underlying challenge solve */
  pointsEarned: number;

  /** Bonus XP from the node's xpBonus field */
  xpBonus: number;

  /** Number of attempts before the correct flag (challege nodes only) */
  attempts: number;
}

export interface ICompletedChapter {
  chapterId: Types.ObjectId;
  completedAt: Date;
}

// Main interface

export interface IUserStoryProgress extends Document {
  user: Types.ObjectId;
  story: Types.ObjectId;

  status: StoryProgressStatus;

  /** Chapter the user is currently on */
  currentChapterId?: Types.ObjectId;

  /** Node the user is currently on within currentChapterId */
  currentNodeId?: Types.ObjectId;

  completedNodes: ICompletedNode[];
  completedChapters: ICompletedChapter[];

  /** Running total XP (challenge points + xpBonus) earned in this story */
  totalXpEarned: number;

  /** Wall-clock time the user started the story */
  startedAt: Date;

  /** Wall-clock time the user completed all required nodes */
  completedAt?: Date;

  /**
   * Running elapsed play time in seconds
   * Updated each time a node is completed
   */
  playTimeSeconds: number;

  /**
   * Set when the user makes a choice at a choice node.
   * Maps nodeId -> chosen option label for replay / analytics
   */
  choicesMade: {
    nodeId: Types.ObjectId;
    choiceLabel: string;
    madeAt: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;

  lastNodeStartedAt: Date;
  restarts: number;
}

// Schema

const completedNodeSchema = new mongoose.Schema<ICompletedNode>(
  {
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryNode",
      required: [true, "Node id is required"],
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    xpBonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const completedChapterSchema = new mongoose.Schema<ICompletedChapter>(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryChapter",
      required: [true, "Chapter id is required"],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const choiceMadeSchema = new mongoose.Schema(
  {
    nodeId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Node id is required"],
    },
    choiceLabel: {
      type: String,
      required: true,
      trim: true,
    },
    madeAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userStoryProgressSchema = new mongoose.Schema<IUserStoryProgress>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Progress must belong to a user"],
      index: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: [true, "Progress must reference a story"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          "not_started",
          "in_progress",
          "completed",
          "abandoned",
        ] satisfies StoryProgressStatus[],
        message: "Invalid status: {VALUE}",
      },
      default: "in_progress",
    },
    currentChapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryChapter",
      default: null,
    },
    currentNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryNode",
      default: null,
    },
    completedNodes: {
      type: [completedNodeSchema],
      default: [],
    },
    completedChapters: {
      type: [completedChapterSchema],
      default: [],
    },
    totalXpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    playTimeSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    choicesMade: {
      type: [choiceMadeSchema],
      default: [],
    },
    lastNodeStartedAt: {
      type: Date,
      default: null,
    },
    restarts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes

// One progress document per user per story
userStoryProgressSchema.index(
  { user: 1, story: 1 },
  { unique: true, name: "unique_user_story_progress" }
);

userStoryProgressSchema.index({ story: 1, status: 1 });
userStoryProgressSchema.index({ story: 1, totalXpEarned: -1 }); // story leaderboard

// virtuals

userStoryProgressSchema.virtual("requiredNodesCompleted").get(function () {
  return this.completedNodes.length;
});

/** Formatted play time as "Xh Ym" */
userStoryProgressSchema.virtual("playTimeFormatted").get(function () {
  const h = Math.floor(this.playTimeSeconds / 3600);
  const m = Math.floor((this.playTimeSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
});

const UserStoryProgress = mongoose.model<IUserStoryProgress>(
  "UserStoryProgress",
  userStoryProgressSchema
);

export default UserStoryProgress;
