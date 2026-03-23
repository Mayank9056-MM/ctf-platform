import { Types } from "mongoose";

// Shared

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type UserRole = "user" | "admin" | "superadmin";

// Dashboard

export type PlatformStats = {
  users: {
    total: number;
    verified: number;
    banned: number;
    deleted: number;
    newLast7Days: number;
    newLast30Days: number;
    activeLastDay: number;
    activeLastWeek: number;
  };
  teams: {
    total: number;
    active: number;
    averageSize: number;
  };
  challenges: {
    total: number;
    visible: number;
    totalSolves: number;
    totalAttempts: number;
    solveRate: number;
    byCategory: { _id: string; count: number; solves: number }[];
    byDifficulty: { _id: string; count: number; solves: number }[];
  };
  submissions: {
    totalToday: number;
    correctToday: number;
    incorrectToday: number;
    firstBloods: number;
    totalAllTime: number;
  };
  stories: {
    total: number;
    published: number;
    totalPlayersStat: number;
    totalCompletions: number;
  };
  topSolvers: {
    _id: string;
    username: string;
    avatar?: { url: string };
    score: number;
    solvedCount: number;
    country?: string;
  }[];
  recentAuditLogs: {
    _id: string;
    action: string;
    summary: string;
    outcome: string;
    createdAt: Date;
  }[];
};

// User Management

export type AdminUserFilters = {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  isBanned?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
  country?: string;
  hasTeam?: boolean;
  sortBy: "score" | "createdAt" | "lastActive" | "username" | "email";
  sortOrder: "asc" | "desc";
};

export type AdminUpdateUserPayload = {
  userId: string;
  requesterId: Types.ObjectId;
  fullName?: string;
  username?: string;
  email?: string;
  score?: number;
  country?: string;
  isVerified?: boolean;
  bio?: string;
};

export type BanUserPayload = {
  userId: string;
  reason: string;
  expiresAt?: Date;
};

export type ManualScoreAdjustPayload = {
  userId: string;
  delta: number;
  reason: string;
  requesterId: Types.ObjectId;
};

export type RecalculateScoresResult = {
  usersUpdated: number;
  teamsUpdated: number;
  durationMs: number;
};

// Admin Account Management

export type CreateAdminPayload = {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
  role: "admin" | "superadmin";
  requesterId: Types.ObjectId;
  requesterRole: string;
  requesterUsername: string;
};

export type AdminListFilters = {
  page: number;
  limit: number;
  role?: "admin" | "superadmin";
  search?: string;
};

// Audit Log

export type AuditLogFilters = {
  page: number;
  limit: number;
  action?: string;
  outcome?: "success" | "failure" | "error";
  actorId?: string;
  targetId?: string;
  collection?: string;
  ipAddress?: string;
  from?: Date;
  to?: Date;
};
