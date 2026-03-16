import mongoose, { Types, Document } from "mongoose";

// Enums

/**
 * The type of a node in a story chapter.
 *
 *  challenge  → wraps an existing Challenge document (flag submission required)
 *  cutscene   → pure narrative moment, no flag required — auto-advances
 *  briefing   → longer narrative block (mission brief, lore dump, map reveal)
 *  choice     → player picks a branch (future: branching paths)
 */
export type StoryNodeType = "challenge" | "cutscene" | "briefing" | "choice";

/**
 * Lifecycle state of a story or chapter.
 *
 *  draft     → only admins can see it
 *  published → visible to participants
 *  archived  → hidden from all listings
 */
export type StoryStatus = "draft" | "published" | "archived";

/**
 * Overall difficulty rating for the story arc.
 * Can differ from individual challenge difficulties.
 */
export type StoryDifficulty =
  | "beginner"
  | "easy"
  | "medium"
  | "hard"
  | "insane";

// Sub documents interfaces

export interface IStoryCharacter {
  /** Short identifier used in nodes, e.g. "agent", "hacker", "analyst" */
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
}

export interface IStoryNode extends Document {
  _id: Types.ObjectId;
  chapter: Types.ObjectId;

  /**
   * Execution order within the chapter.
   * Lower numbers appear first. Gaps are allowed (e.g. 10, 20, 30)
   * so admins can insert nodes without reordering everything.
   */
  order: number;

  type: StoryNodeType;

  /**
   * Ref to an existing Challenge document.
   * Required when type === "challenge", null otherwise.
   */
  challenge?: Types.ObjectId;

  /**
   * Narrative content shown BEFORE the player attempts the challenge.
   * Supports markdown. Think: mission briefing, character dialogue.
   */
  preNarrative?: string;

  /**
   * Narrative content shown AFTER the player successfully solves the challenge.
   * Think: character reaction, plot reveal, next clue teased.
   */
  postNarrative?: string;

  /**
   * Character delivering the narrative (references IStoryCharacter.id).
   * null = narrator / system message.
   */
  characterId?: string;

  /**
   * IDs of other StoryNodes in this chapter that must be completed
   * before this node becomes available.
   * Empty array = always available (first node, or parallel tracks).
   */
  unlockAfter: Types.ObjectId[];

  /**
   * Whether skipping this node is allowed.
   * true = player can proceed without completing it (bonus/side-quest feel).
   */
  isOptional: boolean;

  /**
   * Bonus XP awarded to the player when this node is completed,
   * on top of the challenge's regular points.
   * 0 = no bonus.
   */
  xpBonus: number;

  /**
   * Cutscene / briefing markdown body. Only used when type !== "challenge".
   */
  content?: string;

  /**
   * For type === "choice": the options and which node each unlocks.
   * Stored as plain objects — the story service resolves them.
   */
  choices?: {
    label: string;
    unlocksNode: Types.ObjectId;
  }[];
}

export interface IStoryChapter extends Document {
  _id: Types.ObjectId;
  story: Types.ObjectId;

  title: string;
  slug: string;

  /** Position within the story. Lower = earlier. */
  order: number;

  /**
   * Narrative shown when the chapter is first entered
   * (chapter title card / scene-setter).
   */
  openingNarrative?: string;

  /**
   * Narrative shown after all required nodes in the chapter are complete.
   */
  closingNarrative?: string;

  /** Background / cover image URL for the chapter card */
  coverImageUrl?: string;

  /** Hex accent colour for the chapter card */
  accentColor?: string;

  nodes: IStoryNode[];

  status: StoryStatus;

  /**
   * IDs of chapters that must be completed before this one unlocks.
   * Empty = always available (including the first chapter).
   */
  unlockAfterChapters: Types.ObjectId[];

  /** Estimated time to complete this chapter in minutes */
  estimatedMinutes?: number;
}

export interface IStory extends Document {
  title: string;
  slug: string;
  tagline?: string;
  description?: string;

  coverImageUrl?: string;

  accentColor?: string;

  difficulty: StoryDifficulty;
  status: StoryStatus;

  /** Admin / author who created this story */
  author: Types.ObjectId;

  /** Characters that appear throughout the story */
  characters: IStoryCharacter[];

  chapters: Types.ObjectId[];

  /**
   * Tags for discovery / filtering, e.g. ["osint", "pakistan", "terrorism"]
   */
  tags: string[];

  /**
   * Bonus XP awarded when a player completes ALL non-optional nodes.
   */
  completionXpBonus: number;

  /** Total number of users who have fully completed the story */
  completionCount: number;

  /** Estimated total time across all chapters in minutes */
  estimatedMinutes?: number;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schemas

const storyCharacterSchema = new mongoose.Schema<IStoryCharacter>(
  {
    id: {
      type: String,
      required: [true, "Character id is required"],
      trim: true,
      maxlength: [30, "Character id cannot exceed 30 characters"],
    },
    name: {
      type: String,
      required: [true, "Character name is required"],
      trim: true,
      maxlength: [80, "Character name cannot exceed 80 characters"],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Character bio cannot exceed 300 characters"],
      default: null,
    },
  },
  {
    _id: false,
  }
);

const storyChoiceSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Choice label is required"],
      trim: true,
      maxlength: [120, "Choice label cannot exceed 120 characters"],
    },
    unlocksNode: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Choice must unlock a node"],
    },
  },
  {
    _id: false,
  }
);

const storyNodeSchema = new mongoose.Schema<IStoryNode>(
  {
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryChapter",
      required: true,
    },
    order: {
      type: Number,
      required: [true, "Node order is required"],
      min: [1, "Node order must be at least 1"],
    },
    type: {
      type: String,
      enum: {
        values: [
          "challenge",
          "cutscene",
          "briefing",
          "choice",
        ] satisfies StoryNodeType[],
        message: "Invalid node type: {VALUE}",
      },
      required: [true, "Node type is required"],
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
    preNarrative: {
      type: String,
      trim: true,
      maxlength: [5000, "Pre-narrative cannot exceed 5000 characters"],
      default: null,
    },
    postNarrative: {
      type: String,
      trim: true,
      maxlength: [5000, "Post-narrative cannot exceed 5000 characters"],
      default: null,
    },
    characterId: {
      type: String,
      trim: true,
      default: null,
    },
    unlockAfter: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryNode",
      },
    ],
    isOptional: {
      type: Boolean,
      default: false,
    },
    xpBonus: {
      type: Number,
      default: 0,
      min: [0, "XP bonus cannot be negative"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [10000, "Node content cannot exceed 10,000 characters"],
      default: null,
    },
    choices: {
      type: [storyChoiceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const storyChapterSchema = new mongoose.Schema<IStoryChapter>(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Chapter title is required"],
      trim: true,
      maxlength: [120, "Chapter title cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    order: {
      type: Number,
      required: [true, "Chapter order is required"],
      min: [1, "Chapter order must be at least 1"],
    },
    openingNarrative: {
      type: String,
      trim: true,
      maxlength: [5000, "Opening narrative cannot exceed 5000 characters"],
      default: null,
    },
    closingNarrative: {
      type: String,
      trim: true,
      maxlength: [5000, "Closing narrative cannot exceed 5000 characters"],
      default: null,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    accentColor: {
      type: String,
      match: [/^#[0-9a-fA-F]{6}$/, "accentColor must be a valid hex colour"],
      default: null,
    },
    nodes: {
      type: [storyNodeSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    unlockAfterChapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryChapter",
      },
    ],
    estimatedMinutes: {
      type: Number,
      min: [1, "Estimated minutes must be at least 1"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const storySchema = new mongoose.Schema<IStory>(
  {
    title: {
      type: String,
      required: [true, "Story title is required"],
      unique: true,
      trim: true,
      minlength: [3, "Story title must be at least 3 characters"],
      maxlength: [120, "Story title cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [180, "Tagline cannot exceed 180 characters"],
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [10000, "Description cannot exceed 10,000 characters"],
      default: null,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    accentColor: {
      type: String,
      match: [/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"],
      default: null,
    },
    difficulty: {
      type: String,
      enum: {
        values: [
          "beginner",
          "easy",
          "medium",
          "hard",
          "insane",
        ] satisfies StoryDifficulty[],
        message: "Invalid difficulty {VALUE}",
      },
      default: "medium",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Story must have an author"],
    },
    characters: {
      type: [storyCharacterSchema],
      default: [],
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryChapter",
      },
    ],
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    completionXpBonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedMinutes: {
      type: Number,
      min: 1,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// indexes

storySchema.index({ status: 1, difficulty: 1 });
storySchema.index({ slug: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ author: 1 });
storySchema.index({ completionCount: -1 });

storyChapterSchema.index({ story: 1, order: 1 });
storyChapterSchema.index({ story: 1, status: 1 });

storyNodeSchema.index({ chapter: 1, order: 1 });
storyNodeSchema.index({ challenge: 1 }); // find all nodes using a challenge

// pre save hooks

/** Auto-generate story slug from title */
storySchema.pre("save", function (this: IStory) {
  if (this.isModified("title") && !this.slug) {
    const base = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80);

    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
});

/** Stamp publishedAt when story is first published */
storySchema.pre("save", function (this: IStory) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

/** Validate character IDs are unique within a story */
storySchema.pre("validate", function (this: IStory) {
  const ids = this.characters.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    this.invalidate(
      "characters",
      "Character ids must be unique within a story"
    );
  }
});

/** Auto-generate chapter slug from title */
storyChapterSchema.pre("save", function (this: IStoryChapter) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80);
  }
});

/** challenge field is required when type === "challenge" */
storyNodeSchema.pre("validate", function (this: IStoryNode) {
  if (this.type === "challenge" && !this.challenge) {
    this.invalidate(
      "challenge",
      "A challenge reference is required for nodes of type 'challenge'"
    );
  }
  if (this.type === "choice" && (!this.choices || this.choices.length < 2)) {
    this.invalidate("choices", "Choice nodes must have at least 2 options");
  }
  if (this.type !== "challenge" && !this.content && !this.preNarrative) {
    this.invalidate(
      "content",
      "Non-challenge nodes must have content or preNarrative"
    );
  }
});

// Models

export const StoryNode = mongoose.model<IStoryNode>(
  "StoryNode",
  storyNodeSchema
);
export const StoryChapter = mongoose.model<IStoryChapter>(
  "StoryChapter",
  storyChapterSchema
);

const Story = mongoose.model<IStory>("Story", storySchema);
export default Story;
