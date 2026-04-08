
export type UserRole = "user" | "admin" | "superadmin";

export type PaginationMeta = {
  page: number; limit: number; total: number;
  totalPages: number; hasNext: boolean; hasPrev: boolean;
};

// Dashboard stats

export type PlatformStats = {
  users: {
    total: number; verified: number; banned: number; deleted: number;
    newLast7Days: number; newLast30Days: number; activeLastDay: number; activeLastWeek: number;
  };
  teams: { total: number; active: number; averageSize: number };
  challenges: {
    total: number; visible: number; totalSolves: number; totalAttempts: number; solveRate: number;
    byCategory: { _id: string; count: number; solves: number }[];
    byDifficulty: { _id: string; count: number; solves: number }[];
  };
  submissions: {
    totalToday: number; correctToday: number; incorrectToday: number;
    firstBloods: number; totalAllTime: number;
  };
  stories: { total: number; published: number; totalPlayersStat: number; totalCompletions: number };
  topSolvers: {
    _id: string; username: string; avatar?: { url: string }; score: number; solvedCount: number; country?: string;
  }[];
  recentAuditLogs: {
    _id: string; action: string; summary: string; outcome: string; createdAt: string;
  }[];
};

// Admin user (full shape)

export type AdminUser = {
  _id: string; username: string; email: string; fullName?: string;
  avatar?: { url: string }; role: UserRole; score: number; country?: string;
  isVerified: boolean; isBanned: boolean; isDeleted: boolean; bio?: string;
  teamId?: string; solvedChallenges: string[];
  lastActive: string; createdAt: string; updatedAt: string;
  submissionCount?: number; correctCount?: number;
};

// Audit log

export type AuditLog = {
  _id: string; action: string; outcome: "success" | "failure" | "error";
  actor: { userId: string; username: string; role: string; type: string; ipAddress?: string };
  target?: { id: string; collection: string; label?: string };
  diff?: Record<string, unknown>; metadata?: Record<string, unknown>;
  summary?: string; createdAt: string;
};

// Filter types

export type AdminUserFilters = {
  page?: number; limit?: number; search?: string;
  role?: UserRole; isBanned?: boolean; isVerified?: boolean;
  isDeleted?: boolean; hasTeam?: boolean; country?: string;
  sortBy?: "score" | "createdAt" | "lastActive" | "username" | "email";
  sortOrder?: "asc" | "desc";
};

export type AdminListFilters = {
  page?: number; limit?: number; role?: "admin" | "superadmin"; search?: string;
};

export type AuditLogFilters = {
  page?: number; limit?: number; action?: string;
  outcome?: "success" | "failure" | "error";
  actorId?: string; targetId?: string; collection?: string;
  ipAddress?: string; from?: string; to?: string;
};

// Zustand UI state

export type AdminUIState = {
  // Users table
  userFilters: AdminUserFilters;
  selectedUserId: string | null;

  // Audit log
  auditFilters: AuditLogFilters;
  selectedLogId: string | null;

  // Admin accounts
  adminListFilters: AdminListFilters;

  // Actions
  setUserFilters: (f: Partial<AdminUserFilters>) => void;
  resetUserFilters: () => void;
  setSelectedUser: (id: string | null) => void;
  setAuditFilters: (f: Partial<AuditLogFilters>) => void;
  resetAuditFilters: () => void;
  setSelectedLog: (id: string | null) => void;
  setAdminListFilters: (f: Partial<AdminListFilters>) => void;
};