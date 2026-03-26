import { Types } from "mongoose";
import {
  EventFormat,
  EventStatus,
  EventVisibility,
} from "../../models/event.model";

// Shared

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Scoring Sub-payload

export type ScoringInput = {
  dynamicScoring?: boolean;
  firstBloodBonus?: number;
  incorrectPenalty?: number;
  maxAttemptsPerChallenge?: number;
};

// Registration Sub-payload

export type RegistrationInput = {
  isOpen?: boolean;
  maxParticipants?: number;
  maxTeamSize?: number;
  allowSolo?: boolean;
  inviteCode?: string;
  allowedUsers?: string[];
  allowedTeams?: string[];
  registrationClosesAt?: Date;
};

// Branding Sub-payload

export type BrandingInput = {
  tagline?: string;
  description?: string;
  bannerUrl?: string;
  logoUrl?: string;
  accentColor?: string;
  websiteUrl?: string;
};

// Create / Update

export type CreateEventPayload = {
  name: string;
  format: EventFormat;
  visibility?: EventVisibility;
  opensAt: Date;
  closedAt: Date;
  organizerIds?: string[];
  challengeIds?: string[];
  autoTransition?: boolean;
  scoring?: ScoringInput;
  registration?: RegistrationInput;
  branding?: BrandingInput;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

export type UpdateEventPayload = {
  eventId: string;
  name?: string;
  format?: EventFormat;
  visibility?: EventVisibility;
  opensAt?: Date;
  closedAt?: Date;
  organizerIds?: string[];
  challengeIds?: string[];
  autoTransition?: boolean;
  scoring?: ScoringInput;
  registration?: RegistrationInput;
  branding?: BrandingInput;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Transition

export type TransitionEventPayload = {
  eventId: string;
  newStatus: EventStatus;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Scoreboard Freeze

export type FreezeScoreboardPayload = {
  eventId: string;
  frozen: boolean;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Challenge Management

export type ManageChallengesPayload = {
  eventId: string;
  challengeIds: string[];
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Registration

export type RegisterForEventPayload = {
  eventId: string;
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  inviteCode?: string;
};

// Filters

export type EventFilters = {
  page: number;
  limit: number;
  status?: EventStatus;
  format?: EventFormat;
  visibility?: EventVisibility;
  search?: string;
  sortBy: "opensAt" | "createdAt" | "name" | "registeredCount";
  sortOrder: "asc" | "desc";
};

export type AdminEventFilters = EventFilters & {
  organizerId?: string;
  autoTransition?: boolean;
};

// Leaderboard

export type EventLeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatar?: { url: string };
  country?: string;
  teamId?: string;
  teamName?: string;
  score: number;
  solveCount: number;
  lastSolveAt?: Date;
};

export type EventLeaderboardResult = {
  eventId: string;
  eventName: string;
  isScoreboardFrozen: boolean;
  frozenAt?: Date;
  entries: EventLeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
};

// Stats

export type EventStats = {
  registeredCount: number;
  teamCount: number;
  totalSolves: number;
  totalAttempts: number;
  solveRate: number;
  firstBloods: number;
  topChallenge?: {
    _id: string;
    title: string;
    solveCount: number;
  };
  hardestChallenge?: {
    _id: string;
    title: string;
    solveCount: number;
    attempts: number;
    solveRate: number;
  };
  solvesByCategory: {
    category: string;
    solves: number;
    attempts: number;
  }[];
  activityByHour: {
    hour: string;
    submissions: number;
    correct: number;
  }[];
};
