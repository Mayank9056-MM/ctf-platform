import { Types } from "mongoose";
import {
  ChallengeCategory,
  ChallengeDifficulty,
} from "../../models/challenge.model";

// Input types

export type CreateChallengeInput = {
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  flag: string;
  scoringType?: "static" | "dynamic";
  minPoints?: number;
  flagFormat?: string;
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
  flag?: string | null;
  scoringType?: "static" | "dynamic";
  minPoints?: number;
  flagFormat?: string | null;
  isCaseSensitive?: boolean;
  tags?: string[];
  isHosted?: boolean;
};

export type PurchaseHintInput = {
  hintIndex: number;
};

export type AddHintInput = {
  text: string;
  cost: number;
  order: number;
};

export type AddAttachmentInput = {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  key?: string;
};

export type ChallengeFilterInput = {
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  tags?: string; // comma-separated from query string
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: "points" | "solveCount" | "publishedAt" | "difficulty";
  sortOrder?: "asc" | "desc";
};

// Service payload types

export type CreateChallengePayload = CreateChallengeInput & {
  authorId: Types.ObjectId;
};

export type challengeFilters = {
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  tags?: string[];
  search?: string;
  page: number;
  limit: number;
  sortBy: "points" | "solveCount" | "publishedAt" | "difficulty";
  sortOrder: "asc" | "desc";
};

// Response Types

export type purchasedHintResult = {
  hintText: string;
  pointsDeducted: number;
  hintIndex: number;
};

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
