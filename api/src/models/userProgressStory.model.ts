import mongoose, { mongo, Types } from "mongoose";

export type StoryProgressSchema = "in_progress" | "completed" | "abandoned";

export interface ICompletedNode {
  nodeId: Types.ObjectId;
  challengeId?: Types.ObjectId;
  completedAt: Date;
  pointsEarned: number;
  xpBonus: number;
  attempts: number;
}

export interface IChoiceMade {
  nodeId: Types.ObjectId;
  choiceLabel: string;
  /** The node the player was routed to as a result of this choice */
  routedToNodeId: Types.ObjectId;
  madeAt: Date;
}

export interface ICompletedChapter {
  chapterId: Types.ObjectId;
  completedAt: Date;
}

export interface IUserStoryProgress extends Document {
  user: Types.ObjectId;
  story: Types.ObjectId;
  status: StoryProgressSchema;

  /** Poninter into the graph - where the player is RIGHT NOW */
  currentChapterId: Types.ObjectId;
  currentNodeId: Types.ObjectId;

  /**
   * The active graph path - ordered list of node IDs the player has traversed. When a choice is made, nodes that were on the "other" branch are never added here.
   */
  activePath: Types.ObjectId[];

  /**
   * Set of all completed node IDs (regardless of branch).
   * User for prerequisite checks (unlockAfter)
   */
  completedNodes: ICompletedNode[];

  /**
   * Set of bypassed node IDs - nodes that were on a branch the player did NOT take. Tracked so we don't block story completion on them.
   */
  bypassedNodeIds: Types.ObjectId[];

  completedChapters: ICompletedChapter[];

  /**
   * Every choice made by the player provides full branch history for analytics and replay
   */
  choiceMade: IChoiceMade[];

  totalXpEarned: number;
  startedAt: Date;
  completedAt?: Date;
  playTimeSeconds: number;

  createdAt: Date;
  updatedAt: Date;
}

// Schema

const completedNodeSchema = new mongoose.Schema<ICompletedNode>(
  {
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
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

const choiceMadeSchema = new mongoose.Schema<IChoiceMade>(
  {
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Node id is required"],
    },
    choiceLabel: {
      type: String,
      required: [true, "Choice label is required"],
      trim: true,
    },
    routedToNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Routed to node id is required"],
    },
    madeAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const completedChapterSchema = new mongoose.Schema<ICompletedChapter>(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const userStoryProgressSchema = new mongoose.Schema<IUserStoryProgress>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: [true, "Story is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    currentChapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryChapter",
      required: true,
    },
    currentNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Current node id is required"],
    },
    activePath: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    completedNodes: {
      type: [completedNodeSchema],
      default: [],
    },
    bypassedNodeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    completedChapters: {
      type: [completedChapterSchema],
      default: [],
    },
    choiceMade: {
      type: [choiceMadeSchema],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userStoryProgressSchema.index(
  { user: 1, story: 1 },
  { unique: true, name: "unique_user_story_progress" }
);
userStoryProgressSchema.index({ story: 1, status: 1 });
userStoryProgressSchema.index({ story: 1, totalXpEarned: -1 });

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
