import {
  ChallengeCategory,
  ChallengeDifficulty,
} from "../../models/challenge.model";

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
