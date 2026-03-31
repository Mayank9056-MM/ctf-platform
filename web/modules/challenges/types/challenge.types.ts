export const CHALLENGE_CATEGORIES = [
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
] as const;

export const CHALLENGE_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "insane",
] as const;

export type ChallengeCategory = (typeof CHALLENGE_CATEGORIES)[number];
export type ChallengeDifficulty = (typeof CHALLENGE_DIFFICULTIES)[number];
export type ScoringType = "static" | "dynamic";

// Sub-documents

export type ChallengeHint = {
  text?: string; // only present after purchase
  cost: number;
  order: number;
  isPurchased?: boolean; // annotated by server for the player
};

export type ChallengeAttachment = {
  _id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  key?: string;
};

export type RecentSolve = {
  userId: string;
  username: string;
  avatar?: { url: string };
  solvedAt: string;
};

// Challenge (player view)

export type Challenge = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  /** Base points (before decay) */
  points: number;
  /** Current points after dynamic scoring decay */
  currentPoints: number;
  scoringType: ScoringType;
  minPoints: number;
  isCaseSensitive: boolean;
  flagFormat?: string;
  tags: string[];
  isHosted: boolean;
  isVisible: boolean;
  closedAt?: string;
  solveCount: number;
  totalAttempts: number;
  firstBlood?: {
    userId: string;
    username: string;
    solvedAt: string;
  };
  hints: ChallengeHint[];
  attachments: ChallengeAttachment[];
  recentSolves: RecentSolve[];
  /** Annotated by server — null means unsolved */
  solvedAt?: string | null;
  isFirstBlood?: boolean;
  author: {
    _id: string;
    username: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Challenge (admin view — includes flag field)

export type AdminChallenge = Challenge & {
  flag?: string; // select:false field — only returned when admin explicitly fetches it
  isActive: boolean;
};

// List item

export type ChallengeSummary = Pick<
  Challenge,
  | "_id"
  | "title"
  | "slug"
  | "category"
  | "difficulty"
  | "points"
  | "currentPoints"
  | "solveCount"
  | "isVisible"
  | "tags"
  | "solvedAt"
  | "closedAt"
  | "publishedAt"
  | "createdAt"
>;

// Submission / Solve

export type ChallengeSolve = {
  _id: string;
  rank: number;
  user: {
    _id: string;
    username: string;
    avatar?: { url: string };
    country?: string;
  };
  team?: {
    _id: string;
    name: string;
  };
  pointsAwarded: number;
  isFirstBlood: boolean;
  solveTimeSeconds?: number;
  createdAt: string;
};

export type ChallengeSubmission = {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    avatar?: { url: string };
  };
  team?: { _id: string; name: string };
  isCorrect: boolean;
  pointsAwarded: number;
  isFirstBlood: boolean;
  meta: {
    ipAddress: string;
    userAgent?: string;
    solveTimeSeconds?: number;
  };
  createdAt: string;
};

// Stats

export type ChallengeStatsByCategory = {
  _id: ChallengeCategory;
  count: number;
  totalSolves: number;
  avgPoints: number;
  visible: number;
};

export type AdminChallengeStats = {
  byCategory: ChallengeStatsByCategory[];
  totals: {
    total: number;
    visible: number;
    totalSolves: number;
  };
};

export type PurchasedHintResult = {
  hintText: string;
  pointsDeducted: number;
  hintIndex: number;
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

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

// Filter / Input shapes

export type ChallengeFilters = {
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  tags?: string; // comma-separated
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "points" | "solveCount" | "publishedAt" | "difficulty";
  sortOrder?: "asc" | "desc";
};

export type CreateChallengeInput = {
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  flag: string;
  scoringType?: ScoringType;
  minPoints?: number;
  isCaseSensitive?: boolean;
  tags?: string[];
  isHosted?: boolean;
};

export type UpdateChallengeInput = {
  title?: string;
  description?: string;
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  points?: number;
  flag?: string;
  scoringType?: ScoringType;
  minPoints?: number;
  flagFormat?: string | null;
  isCaseSensitive?: boolean;
  tags?: string[];
  isHosted?: boolean;
  isVisible?: boolean;
  closedAt?: string | null;
};

export type AddHintInput = {
  text: string;
  cost: number;
  order: number;
};

export type AddAttachmentInput = {
  file: File;
  name: string;
};
