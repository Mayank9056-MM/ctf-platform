// Submit flag

export type SubmitFlagResult = {
  isCorrect: boolean;
  pointsAwarded: number;
  isFirstBlood: boolean;
  message: string;
  newScore?: number;
  /** Wrong attempts in the current rate-limit window */
  attemptsInWindow?: number;
};

// Submission document

export type SubmissionUser = {
  _id: string;
  username: string;
  email?: string;
  avatar?: { url: string };
  country?: string;
  role?: string;
};

export type SubmissionTeam = {
  _id: string;
  name: string;
  avatar?: string;
  score?: number;
};

export type SubmissionChallenge = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  points: number;
  scoringType?: "static" | "dynamic";
};

export type SubmissionMeta = {
  ipAddress: string;
  userAgent?: string;
  solveTimeSeconds?: number;
};

export type Submission = {
  _id: string;
  user: SubmissionUser;
  challenge: SubmissionChallenge;
  team?: SubmissionTeam | null;
  isCorrect: boolean;
  pointsAwarded: number;
  isFirstBlood: boolean;
  meta: SubmissionMeta;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
};

// My submission (player view — no IP/UA)

export type MySubmission = {
  _id: string;
  challenge: Pick<
    SubmissionChallenge,
    "_id" | "title" | "slug" | "category" | "difficulty" | "points"
  >;
  team?: SubmissionTeam | null;
  isCorrect: boolean;
  pointsAwarded: number;
  isFirstBlood: boolean;
  /** Only present for the player's own submissions */
  meta: { solveTimeSeconds?: number };
  createdAt: string;
};

// Challenge history entry (own attempts on one challenge)

export type ChallengeHistoryEntry = {
  _id: string;
  isCorrect: boolean;
  pointsAwarded: number;
  isFirstBlood: boolean;
  meta: { solveTimeSeconds?: number };
  createdAt: string;
};

// Solve leaderboard entry (public)

export type ChallengeSolveEntry = {
  rank: number;
  _id: string;
  user: Pick<SubmissionUser, "_id" | "username" | "avatar" | "country">;
  team?: SubmissionTeam | null;
  pointsAwarded: number;
  isFirstBlood: boolean;
  meta: { solveTimeSeconds?: number };
  createdAt: string;
};

// Stats

export type UserSubmissionStats = {
  total: number;
  correct: number;
  incorrect: number;
  firstBloods: number;
  totalPointsEarned: number;
  averageAttemptsPerSolve: number;
  solveRate: number;
  recentActivity: { date: string; count: number }[];
  rank: number;
  streak: number;
  challengesSolved: number;
};

export type AdminSubmissionStats = {
  total: number;
  correct: number;
  incorrect: number;
  firstBloods: number;
  solveRate: number;
  uniqueSolvers: number;
  uniqueChallenges: number;
  topSolvers: {
    userId: string;
    username: string;
    avatar?: { url: string };
    correctCount: number;
    totalPoints: number;
  }[];
  activityByDay: { date: string; correct: number; incorrect: number }[];
  byCategory: {
    category: string;
    correct: number;
    incorrect: number;
    solveRate: number;
  }[];
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

// Filter types

export type MySubmissionsFilters = {
  page?: number;
  limit?: number;
  isCorrect?: boolean;
  challengeId?: string;
  sortOrder?: "asc" | "desc";
};

export type AdminSubmissionsFilters = {
  page?: number;
  limit?: number;
  isCorrect?: boolean;
  isFirstBlood?: boolean;
  userId?: string;
  teamId?: string;
  challengeId?: string;
  ipAddress?: string;
  from?: string; // ISO string
  to?: string;
  sortBy?: "createdAt" | "pointsAwarded";
  sortOrder?: "asc" | "desc";
};

export type AdminStatsFilters = {
  from?: string;
  to?: string;
  challengeId?: string;
};

// Zustand UI state

export type SubmissionUIState = {
  // My submissions page
  myPage: number;
  myIsCorrectFilter: boolean | "all";
  myChallengeidFilter: string | null;
  mySortOrder: "asc" | "desc";

  // Challenge history panel (challenge detail page)
  historyPage: number;

  // Admin submissions
  adminPage: number;
  adminFilters: AdminSubmissionsFilters;
  adminStatsFilters: AdminStatsFilters;
  selectedSubmissionId: string | null;

  // Actions
  setMyPage: (page: number) => void;
  setMyIsCorrectFilter: (v: boolean | "all") => void;
  setMyChallengeidFilter: (id: string | null) => void;
  setMySortOrder: (o: "asc" | "desc") => void;
  resetMyFilters: () => void;

  setHistoryPage: (page: number) => void;

  setAdminPage: (page: number) => void;
  setAdminFilters: (f: Partial<AdminSubmissionsFilters>) => void;
  resetAdminFilters: () => void;
  setAdminStatsFilters: (f: Partial<AdminStatsFilters>) => void;
  setSelectedSubmission: (id: string | null) => void;
};
