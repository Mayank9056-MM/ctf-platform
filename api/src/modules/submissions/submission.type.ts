import { Types } from "mongoose";

// Player

export type SubmitFlagInput = {
  flag: string;
};

export type SubmitFlagPayload = {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  challengeId: string;
  flag: string;
  ip: string;
  userAgent?: string;
};

export type SubmitFlagResult = {
  isCorrect: boolean;
  pointsAwarded: number;
  isFirstBlood: boolean;
  message: string;
  newScore?: number;
  /** How many incorrect attempts the user has made in the current window */
  attemptsInWindow?: number;
};

// Player Filters

export type MySubmissionFilters = {
  page: number;
  limit: number;
  isCorrect?: boolean;
  challengeId?: string;
  sortOrder: "asc" | "desc";
};

export type ChallengeSubmissionHistoryFilters = {
  page: number;
  limit: number;
};

// Admin Filters

export type AdminSubmissionFilters = {
  page: number;
  limit: number;
  isCorrect?: boolean;
  isFirstBlood?: boolean;
  userId?: string;
  teamId?: string;
  challengeId?: string;
  ipAddress?: string;
  from?: Date;
  to?: Date;
  sortBy: "createdAt" | "pointsAwarded";
  sortOrder: "asc" | "desc";
};

// Stats

export type SubmissionStats = {
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
  activityByDay: {
    date: string;
    correct: number;
    incorrect: number;
  }[];
  byCategory: {
    category: string;
    correct: number;
    incorrect: number;
    solveRate: number;
  }[];
};

export type UserSubmissionStats = {
  total: number;
  correct: number;
  incorrect: number;
  firstBloods: number;
  totalPointsEarned: number;
  averageAttemptsPerSolve: number;
  solveRate: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
  rank: number;
  streak: number;
  challengesSolved: number;
};
