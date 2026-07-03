import { Types } from "mongoose";
import {
  StoryDifficulty,
  StoryNodeType,
  StoryStatus,
} from "../../models/story.model";
import { ConnectEdgeInput, SavePositionsInput } from "./story.validator";

// Story CRUD

export type CreateStoryPayload = {
  title: string;
  tagline?: string;
  description?: string;
  difficulty?: StoryDifficulty;
  tags?: string[];
  coverImageLocalPath?: string;
  accentColor?: string;
  completionXpBonus?: number;
  estimatedMinutes?: number;
  authorId: Types.ObjectId;
};

export type UpdateStoryPayload = Partial<
  Omit<CreateStoryPayload, "authorId">
> & {
  storyId: string;
  requesterId: Types.ObjectId;
};

export type ConnectEdgePayload = ConnectEdgeInput & {
  chapterId: string;
  storyId: string;
};

export type DisconnectEdgePayload = {
  edgeId: string;
  chapterId: string;
  storyId: string;
};

export type SavePositionsPayload = SavePositionsInput & {
  chapterId: string;
  storyId: string;
};

// Chapter CRUD

export type CreateChapterPayload = {
  storyId: string;
  title: string;
  order: number;
  openingNarrative?: string;
  closingNarrative?: string;
  coverImageLocalPath?: string;
  accentColor?: string;
  estimatedMinutes?: number;
  unlockAfterChapters?: string[];
  requesterId: Types.ObjectId;
};

export type UpdateChapterPayload = Partial<
  Omit<CreateChapterPayload, "storyId" | "requesterId">
> & {
  chapterId: string;
  storyId: string;
  requesterId: Types.ObjectId;
};

// Node CRUD

export type CreateNodePayload = {
  chapterId: string;
  storyId: string;
  type: StoryNodeType;
  order: number;
  isEntryPoint?: boolean;
  challengeId?: string;
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
  /** For linear nodes: which node comes next in the graph */
  nextNode?: string;
  /**
   * For choice nodes: each option and the node it routes to.
   * targetNode must reference a node in the same chapter.
   */
  choices?: { label: string; description?: string; targetNode: string }[];
  /** AND-gate prerequisites: all must be complete before this node unlocks */
  unlockAfter?: string[];
  isOptional?: boolean;
  xpBonus?: number;
  content?: string;
  requesterId: Types.ObjectId;
};

export type UpdateNodePayload = Partial<
  Omit<CreateNodePayload, "chapterId" | "storyId" | "requesterId">
> & {
  nodeId: string;
  chapterId: string;
  requesterId: Types.ObjectId;
};

// Player Operations

export type StartStoryPayload = {
  storyId: string;
  userId: Types.ObjectId;
};

export type AdvanceNodePayload = {
  storyId: string;
  chapterId: string;
  nodeId: string;
  userId: Types.ObjectId;
  elapsedSeconds?: number;
};

export type MakeChoicePayload = {
  storyId: string;
  chapterId: string;
  nodeId: string;
  userId: Types.ObjectId;
  choiceLabel: string;
};

/**
 * Internal payload used by _commitNodeCompletion transaction.
 * Not exposed to controllers.
 */
export type CommitNodePayload = {
  storyId: string;
  chapterId: string;
  nodeId: string;
  userId: Types.ObjectId;
  pointsEarned: number;
  attempts: number;
  elapsedSeconds: number;
  /** Populated for choice nodes */
  choiceLabel?: string;
  /** The node the graph routes to after this one (null if terminal) */
  resolvedNextNodeId?: string | null;
  /** Node IDs on branches NOT taken (for bypassing) */
  bypassedNodeIds?: string[];
};

// Response Shapes

export type NodeCompleteResult = {
  nodeId: string;
  xpBonus: number;
  /** postNarrative to show the player after completion */
  postNarrative: string | null;
  /** Where the player goes next */
  nextNodeId: string | null;
  nextChapterId: string | null;
  /** True if ALL required nodes in the chapter are now done */
  chapterCompleted: boolean;
  /** True if the entire story is now complete */
  storyCompleted: boolean;
  /** Bonus XP for finishing the whole story */
  completionXpBonus: number;
  totalXpEarned: number;
};

export type StoryProgressView = {
  storyId: string;
  status: string;
  currentChapterId: string;
  currentNodeId: string;
  completedNodeIds: string[];
  bypassedNodeIds: string[];
  activePath: string[];
  totalXpEarned: number;
  playTimeSeconds: number;
  playTimeFormatted: string;
  choicesMade: {
    nodeId: string;
    choiceLabel: string;
    routedToNodeId: string;
    madeAt: Date;
  }[];
};

export type GraphValidationResult = {
  valid: boolean;
  errors: string[];
};

// Filters

export type StoryFilters = {
  status?: StoryStatus;
  difficulty?: StoryDifficulty;
  tags?: string[];
  search?: string;
  page: number;
  limit: number;
};
