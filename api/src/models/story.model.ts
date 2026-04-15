import mongoose, { Types, Document } from "mongoose";
import { DIFFICULTY_LEVELS } from "../utils/constants";

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

// Sub document interfaces

export interface IStoryCharacter {
  id: string;
  name: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  bio?: string;
}

export interface IStoryChoice {
  label: string;
  description?: string;
  targetNode: Types.ObjectId;
}

export interface IStoryNode extends Document {
  _id: Types.ObjectId;
  chapter: Types.ObjectId;

  /** Display order - used for rendering the chapter map, NOT execution order */
  order: number;

  type: StoryNodeType;

  /**
   * True for the node(s) that start this chapter
   * Every chapter must have exactly one entry point
   */

  isEntryPoint: boolean;

  challenge?: Types.ObjectId;

  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;

  /**
   * Graph edge for linear nodes (challenge, cutscene, briefing)
   * null = this node is a terminal node (end of chapter or story branch).
   */
  nextNode?: Types.ObjectId;

  /**
   * Graph branches for choice nodes.
   * Each option leads to a different targetNode within the same chapter.
   * Mnimum 2 required for type === "choice".
   */
  choices: IStoryChoice[];

  /**
   * Prerequisite nodes - All must be completed before the node unlocks.
   * Used for parallel tracks within a chapter (e.g. two challenges that can be done in any order, then both must be done to unlock a boss node).
   * Different from `nextNode` - that's the default forward edge.
   * This is an AND-gate: all listed nodes must be complete
   */
  unlockAfter: Types.ObjectId[];

  isOptional: boolean;
  xpBonus: number;

  /** Body for cutscene/briefing ndoes */
  content?: string;
}

export interface IStoryChapter extends Document {
  _id: Types.ObjectId;
  story: Types.ObjectId;
  title: string;
  slug: string;
  order: number;
  openingNarrative?: string;
  closingNarrative?: string;
  coverImage?: {
    url: string;
    publicId: string;
  };
  accentColor?: string;
  status: StoryStatus;
  unlockAfterChapters: Types.ObjectId[];
  estimatedMinutes?: number;

  /**
   * Cached reference to the entry point node.
   * Set automatically when the chapter is published
   * Speed up "start chapter" lookups without scanning all nodes
   */
  entryNodeId?: Types.ObjectId;

  nodes: IStoryNode[];

  /**
   * Validate the chapter's node graph for integrity.
   * Called before publish. Throws on any violation.
   */
  validateGraph(): {
    valid: boolean;
    errors: string[];
  };
}

export interface IStory extends Document {
  title: string;
  slug: string;
  tagline?: string;
  description?: string;
  coverImage?: {
    url: string;
    publicId: string;
  };
  accentColor?: string;
  difficulty: StoryDifficulty;
  status: StoryStatus;
  author: Types.ObjectId;
  characters: IStoryCharacter[];
  chapters: Types.ObjectId[];
  tags: string[];
  completionXpBonus: number;
  completionCount: number;
  estimatedMinutes?: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schemas

const coverImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "/images/default-coverImage.png",
    },
    publicId: {
      type: String,
      default: undefined,
    },
  },
  { _id: false }
);

const avatarImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "/images/default-avatar.png",
    },
    publicId: {
      type: String,
      default: undefined,
    },
  },
  { _id: false }
);

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
    avatar: avatarImageSchema,
    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Character bio cannot exceed 300 characters"],
      default: null,
    },
  },
  { _id: false }
);

const storyChoiceSchema = new mongoose.Schema<IStoryChoice>(
  {
    label: {
      type: String,
      required: [true, "Choice label is required"],
      trim: true,
      maxlength: [120, "Choice label cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Choice description cannot exceed 300 characters"],
      default: null,
    },
    targetNode: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Choice must have a target node"],
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
    isEntryPoint: {
      type: Boolean,
      default: false,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
    preNarrative: {
      type: String,
      trim: true,
      maxlength: [5000, "Pre-narrative cannot exceed 5,000 characters"],
      default: null,
    },
    postNarrative: {
      type: String,
      trim: true,
      maxlength: [5000, "Post-narrative cannot exceed 5,000 characters"],
      default: null,
    },
    characterId: {
      type: String,
      trim: true,
      default: null,
    },
    nextNode: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    choices: {
      type: [storyChoiceSchema],
      default: [],
    },
    unlockAfter: [
      {
        type: mongoose.Schema.Types.ObjectId,
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
      maxlength: [10000, "Node content exceed 10,000 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const storyChapterSchema = new mongoose.Schema<IStoryChapter>(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
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
      maxlength: [
        5000,
        "Opening-narrative should not be more than 5000 words.",
      ],
      default: null,
    },
    closingNarrative: {
      type: String,
      trim: true,
      maxlength: [
        5000,
        "Closing-narrative should not be more than 5000 words.",
      ],
      default: null,
    },
    coverImage: coverImageSchema,
    accentColor: {
      type: String,
      match: [/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"],
      default: null,
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
      min: 1,
      default: null,
    },
    entryNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    nodes: {
      type: [storyNodeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
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
    coverImage: coverImageSchema,
    accentColor: {
      type: String,
      match: [/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"],
      default: null,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
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
      required: true,
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
        maxlength: [30, "tag length must be less than 30"],
      },
    ],
    completionXpBonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedMinutes: {
      type: Number,
      min: [1, "Estimated minutes cannot be negative"],
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

// Indexes

storySchema.index({ status: 1, difficulty: 1 });
storySchema.index({ slug: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ author: 1 });
storySchema.index({ completionCount: -1 });

storyChapterSchema.index({ story: 1, order: 1 });
storyChapterSchema.index({ story: 1, status: 1 });

storyNodeSchema.index({ chapter: 1, order: 1 });
storyNodeSchema.index({ challenge: 1 });

// Pre-save hooks

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

storySchema.pre("save", function (this: IStory) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

storySchema.pre("validate", function (this: IStory) {
  const ids = this.characters.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    this.invalidate(
      "Characters",
      "Character ids must be unique within a story"
    );
  }
});

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

// Chapter Graph Validation Method

/**
 * Validates the node graph within a chapter before publishing.
 *
 * Rules enforced:
 *   1. Exactly one entry point node
 *   2. All nextNode references point to nodes within this chapter
 *   3. All choice.targetNode references point to nodes within this chapter
 *   4. All unlockAfter references point to nodes within this chapter
 *   5. No cycles in the graph (DFS cycle detection)
 *   6. All nodes are reachable from the entry point
 *   7. Choice nodes have at least 2 choices
 *   8. Challenge nodes have a challenge reference
 *   9. Non-challenge nodes have content or preNarrative
 */

storyChapterSchema.methods.validateGraph = function (this: IStoryChapter): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const nodes = this.nodes;
  const nodeIds = new Set(nodes.map((n) => n._id.toString()));

  // Rule 1: Exactly one entry point
  const entryPoints = nodes.filter((n) => n.isEntryPoint);

  if (entryPoints.length === 0) {
    errors.push("Chapter must have exactly one entry point node");
  } else if (entryPoints.length > 1) {
    errors.push(
      `Chapter has ${entryPoints.length} entry points - only one is allowed`
    );
  }

  // Per-node validations
  for (const node of nodes) {
    const label = `Node [order=${node.order}, type=${node.type}]`;

    // challenge ref
    if (node.type === "challenge" && !node.challenge) {
      errors.push(`${label}: challenge reference is required`);
    }

    // content or preNarrative for non-challenge nodes
    if (node.type !== "challenge" && !node.content && !node.preNarrative) {
      errors.push(`${label}: must have content or preNarrative`);
    }

    // Choice nodes
    if (node.type === "choice") {
      if (node.choices.length < 2) {
        errors.push(`${label}: choice nodes must have at least 2 options`);
      }
      if (node.nextNode) {
        errors.push(`
          ${label}: choice nodes must not have nextNode - use choices[].targetNode instead`);
      }
    }

    // each choice target must exist
    for (const choice of node.choices) {
      if (!nodeIds.has(choice.targetNode.toString())) {
        errors.push(
          `${label}: choice "${choice.label}" targets unknown node ${choice.targetNode}`
        );
      }
    }

    // Next node must exist within chapter
    if (node.nextNode && !nodeIds.has(node.nextNode.toString())) {
      errors.push(
        `${label}: nextNode ${node.nextNode} does not exist1 in this chapter`
      );
    }

    // Unlock after refs
    for (const prereq of node.unlockAfter) {
      if (!nodeIds.has(prereq.toString())) {
        errors.push(`${label}: unlockAfter references unknown node ${prereq}`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Cycle detection (DFS)

  // Build adjacency list from all forward edges
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    const id = node._id.toString();
    const edges: string[] = [];

    if (node.nextNode) {
      edges.push(node.nextNode.toString());
    }

    for (const c of node.choices) {
      edges.push(c.targetNode.toString());
    }

    adjacency.set(id, edges);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map<string, number>();

  for (const id of nodeIds) {
    color.set(id, WHITE);
  }

  const cycleDetected: string[] = [];

  function dfs(id: string, path: string[]): boolean {
    color.set(id, GRAY);

    for (const neighbour of adjacency.get(id) ?? []) {
      if (color.get(neighbour) === GRAY) {
        cycleDetected.push(
          `Cycle detected: ${[...path, id, neighbour].join("-> ")}`
        );
        return true;
      }
      if (color.get(neighbour) === WHITE) {
        if (dfs(neighbour, [...path, id])) {
          return true;
        }
      }
    }

    color.set(id, BLACK);
    return false;
  }

  for (const id of nodeIds) {
    if (color.get(id) === WHITE) {
      if (dfs(id, [])) {
        break;
      }
    }
  }

  if (cycleDetected.length > 0) {
    errors.push(...cycleDetected);
    return {
      valid: false,
      errors,
    };
  }

  // Reachability from entry point
  if (entryPoints.length === 1) {
    const entryId = entryPoints[0]._id.toString();
    const visited = new Set<string>();

    function bfs(startId: string) {
      const queue = [startId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        for (const neighbour of adjacency.get(current) ?? []) {
          if (!visited.has(neighbour)) {
            queue.push(neighbour);
          }
        }

        // Also traverse unlockAfter edges (they can be reached if prerequisites are met)
        const node = nodes.find((n) => n._id.toString() === current);

        for (const prereq of node?.unlockAfter ?? []) {
          // Don't mark as unreachable - they're rechable one prereqs done
        }
      }
    }

    bfs(entryId);

    // Only non-optional required nodes matter for reachability
    const unreachable = nodes.filter(
      (n) =>
        !n.isOptional &&
        !visited.has(n._id.toString()) &&
        n.unlockAfter.length === 0
    );

    if (unreachable.length > 0) {
      for (const n of unreachable) {
        errors.push(
          `Node [order=${n.order}] is not reachable from the entry point and has no prerequisites - all required nodes must be reachable`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

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
