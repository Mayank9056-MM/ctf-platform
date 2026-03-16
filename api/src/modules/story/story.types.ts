import { Types } from "mongoose";
import {
  StoryDifficulty,
  StoryNodeType,
  StoryChapter,
  StoryStatus,
} from "../../models/story.model";

// Story CRUD

export type CreateStoryPayload = {
  title: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  coverImageUrl?: string;
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

// Chapter CRUD

export type CreateChapterPayload = {
  storyId: string;
  title: string;
  order: number;
  openingNarrative?: string;
  closingNarrative?: string;
  coverImageUrl?: string;
  accentColor?: string;
  estimatedMinutes?: string;
  unlockAfterChapters?: string[];
  requesterId: Types.ObjectId;
};

export type UpdateChapterPayload = Partial<
  Omit<CreateChapterPayload, "storyId" | "requesterId">
> & {
  chapterId: string;
  storyId: string;
  requesterid: Types.ObjectId;
};

// Node CRUD

export type CreateNodePayload = {
  chapterId: string;
  storyId: string;
  type: StoryNodeType;
  order: number;
  /** Required when type === "challenge" */
  challengeId?: string;
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
  unlockAfter?: string[];
  isOptional: boolean;
  xpBonus?: number;
  content?: string;
  choices?: {
    label: string;
    unlocksNode: string;
  }[];
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

export type CompleteNodePayload = {
  storyId: string;
  chapterId: string;
  nodeId: string;
  userId: Types.ObjectId;

  pointsEarned?: number;
  attempts?: number;

  choiceLabel?: string;
  elapsedSeconds?: number;
};

export type MakeChoicePayload = {
  storyId: string;
  chapterId: string;
  nodeId: string;
  userId: Types.ObjectId;
  choiceLabel: string;
};

// Response Shapes

export type StoryProgressView = {
  storyId: string;
  status: string;
  currentChapterId?: string;
  currentNodeId?: string;
  completedNodeIds: string[];
  completedChapterIds: string[];
  totalXpEarned: number;
  playTimeSeconds: number;
  playTimeFormatted: string;
  unlockedNodeIds: string[];
};

export type CompleteNodeResult = {
  nodeId: string;
  xpBonus: number;
  chapterCompleted: boolean;
  storyCompleted: boolean;
  completionXpBonus: number;
  nextNodeId?: string;
  nextChapterId?: string;
  postNarrative?: string;
  totalXpEarned: number;
};

/// Admin filters

export type StoryFilters = {
  status?: StoryStatus;
  difficulty?: StoryDifficulty;
  tags?: string[];
  search?: string;
  page: number;
  limit: number;
};
