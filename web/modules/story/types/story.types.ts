// Enums

export const STORY_DIFFICULTIES = ["easy", "medium", "hard", "insane"] as const;

export const STORY_STATUSES = ["draft", "published", "archived"] as const;

export const NODE_TYPES = [
  "challenge",
  "cutscene",
  "briefing",
  "choice",
] as const;

export type StoryDifficulty = (typeof STORY_DIFFICULTIES)[number];
export type StoryStatus = (typeof STORY_STATUSES)[number];
export type StoryNodeType = (typeof NODE_TYPES)[number];

// Sub-documents

export type StoryCharacter = {
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
};

export type StoryAuthor = {
  _id: string;
  username: string;
  avatar?: { url: string };
};

export type NodeChoice = {
  label: string;
  description?: string;
  targetNode: string;
};

// Node

export type StoryNode = {
  _id: string;
  type: StoryNodeType;
  order: number;
  isEntryPoint: boolean;
  challengeId?: string;
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
  nextNode?: string;
  choices?: NodeChoice[];
  unlockAfter: string[];
  isOptional: boolean;
  xpBonus: number;
  content?: string;
};

// Chapter

export type StoryChapter = {
  _id: string;
  title: string;
  order: number;
  openingNarrative?: string;
  closingNarrative?: string;
  coverImageUrl?: string;
  accentColor?: string;
  estimatedMinutes?: number;
  unlockAfterChapters: string[];
  isPublished: boolean;
  publishedAt?: string;
  nodes: StoryNode[];
};

// Story

export type Story = {
  _id: string;
  title: string;
  slug: string;
  tagline?: string;
  description?: string;
  difficulty: StoryDifficulty;
  status: StoryStatus;
  tags: string[];
  coverImageUrl?: string;
  accentColor?: string;
  completionXpBonus: number;
  estimatedMinutes?: number;
  author: StoryAuthor;
  characters: StoryCharacter[];
  chapters: StoryChapter[];
  completionCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Annotated by server when authenticated
  userStatus?: "not_started" | "in_progress" | "completed";
};

// Story summary (list shape)

export type StorySummary = Pick<
  Story,
  | "_id"
  | "title"
  | "slug"
  | "tagline"
  | "difficulty"
  | "status"
  | "tags"
  | "coverImageUrl"
  | "accentColor"
  | "completionXpBonus"
  | "estimatedMinutes"
  | "completionCount"
  | "publishedAt"
  | "createdAt"
  | "userStatus"
> & { author: Pick<StoryAuthor, "_id" | "username"> };

// Progress

export type StoryProgressView = {
  storyId: string;
  status: "in_progress" | "completed" | "abandoned";
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
    madeAt: string;
  }[];
};

// Node complete result

export type NodeCompleteResult = {
  nodeId: string;
  xpBonus: number;
  postNarrative: string | null;
  nextNodeId: string | null;
  nextChapterId: string | null;
  chapterCompleted: boolean;
  storyCompleted: boolean;
  completionXpBonus: number;
  totalXpEarned: number;
};

// Leaderboard

export type StoryLeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatar?: { url: string };
  completedAt: string;
  totalXpEarned: number;
  playTimeSeconds: number;
};

// Graph validation

export type GraphValidationResult = {
  valid: boolean;
  errors: string[];
};

// Pagination

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Filters

export type StoryListFilters = {
  status?: StoryStatus;
  difficulty?: StoryDifficulty;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
};

// Zustand UI state

export type StoryUIState = {
  // Admin story list
  adminPage: number;
  adminStatusFilter: StoryStatus | "all";
  adminSearch: string;

  // Chapter/node editor (selected IDs for admin detail view)
  selectedChapterId: string | null;
  selectedNodeId: string | null;

  // Actions
  setAdminPage: (page: number) => void;
  setAdminStatusFilter: (s: StoryStatus | "all") => void;
  setAdminSearch: (q: string) => void;
  setSelectedChapter: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  resetAdminFilters: () => void;
};
