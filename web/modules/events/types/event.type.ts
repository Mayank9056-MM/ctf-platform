// Derived types from const arrays

import {
  EVENT_FORMATS,
  EVENT_SORT_OPTIONS,
  EVENT_STATUSES,
  EVENT_VISIBILITIES,
  LEADERBOARD_TYPES,
} from "../constants/event.constants";

export type EventFormat = (typeof EVENT_FORMATS)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];
export type EventSortBy = (typeof EVENT_SORT_OPTIONS)[number];
export type LeaderboardType = (typeof LEADERBOARD_TYPES)[number];

// Sub-documents

export type EventOrganizer = {
  _id: string;
  username: string;
  avatar?: { url: string };
  email?: string; // admin view only
};

export type EventScoring = {
  dynamicScoring: boolean;
  firstBloodBonus: number;
  incorrectPenalty: number;
  maxAttemptsPerChallenge: number;
  scoreboardFrozen: boolean;
  scoreboardFrozenAt?: string | null;
};

export type EventRegistration = {
  isOpen: boolean;
  maxParticipants: number;
  maxTeamSize: number;
  allowSolo: boolean;
  /** Only present for organizers / admins */
  inviteCode?: string | null;
  allowedUsers?: string[];
  allowedTeams?: string[];
  registrationClosesAt?: string | null;
};

export type EventBranding = {
  tagline?: string | null;
  description?: string | null;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
  websiteUrl?: string | null;
};

export type EventStats = {
  registeredCount: number;
  teamCount: number;
  totalSolves: number;
  totalAttempts: number;
  lastRefreshedAt?: string | null;
};

// Full Event document

export type Event = {
  _id: string;
  name: string;
  slug: string;
  format: EventFormat;
  status: EventStatus;
  visibility: EventVisibility;
  organizers: EventOrganizer[];
  challenges: string[];
  opensAt: string;
  closedAt: string;
  scoring: EventScoring;
  registration: EventRegistration;
  branding: EventBranding;
  stats: EventStats;
  autoTransition: boolean;
  endedEarlyAt?: string | null;
  endedEarlyBy?: string | null;
  createdAt: string;
  updatedAt: string;
  // virtuals
  durationMs?: number;
  isWithinWindow?: boolean;
  minutesRemaining?: number;
  // annotated by server when authenticated
  isOrganizer?: boolean;
  isRegistered?: boolean;
};

// Summary

export type EventSummary = Pick<
  Event,
  | "_id"
  | "name"
  | "slug"
  | "format"
  | "status"
  | "visibility"
  | "opensAt"
  | "closedAt"
  | "branding"
  | "stats"
  | "scoring"
  | "autoTransition"
  | "createdAt"
  | "isRegistered"
  | "minutesRemaining"
> & {
  organizers: Pick<EventOrganizer, "_id" | "username" | "avatar">[];
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
  lastSolveAt?: string;
};

export type EventLeaderboard = {
  eventId: string;
  eventName: string;
  isScoreboardFrozen: boolean;
  frozenAt?: string;
  entries: EventLeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
};

// Detailed stats

export type EventDetailedStats = {
  registeredCount: number;
  teamCount: number;
  totalSolves: number;
  totalAttempts: number;
  solveRate: number;
  firstBloods: number;
  topChallenge?: { _id: string; title: string; solveCount: number };
  hardestChallenge?: {
    _id: string;
    title: string;
    solveCount: number;
    attempts: number;
    solveRate: number;
  };
  solvesByCategory: { category: string; solves: number; attempts: number }[];
  activityByHour: { hour: string; submissions: number; correct: number }[];
};

// Dispatch queue result (admin)

export type AutoTransitionResult = {
  activated: string[];
  ended: string[];
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

export type EventListFilters = {
  page?: number;
  limit?: number;
  status?: EventStatus;
  format?: EventFormat;
  visibility?: EventVisibility;
  search?: string;
  sortBy?: EventSortBy;
  sortOrder?: "asc" | "desc";
};

export type AdminEventListFilters = EventListFilters & {
  organizerId?: string;
  autoTransition?: boolean;
};

export type LeaderboardFilters = {
  page?: number;
  limit?: number;
  type?: LeaderboardType;
};

// Request payloads

export type ScoringInput = {
  dynamicScoring?: boolean;
  firstBloodBonus?: number;
  incorrectPenalty?: number;
  maxAttemptsPerChallenge?: number;
};

export type RegistrationInput = {
  isOpen?: boolean;
  maxParticipants?: number;
  maxTeamSize?: number;
  allowSolo?: boolean;
  inviteCode?: string;
  allowedUsers?: string[];
  allowedTeams?: string[];
  registrationClosesAt?: string;
};

export type BrandingInput = {
  tagline?: string;
  description?: string;
  bannerUrl?: string;
  logoUrl?: string;
  accentColor?: string;
  websiteUrl?: string;
};

export type CreateEventPayload = {
  name: string;
  format: EventFormat;
  visibility?: EventVisibility;
  opensAt: string;
  closedAt: string;
  organizerIds?: string[];
  challengeIds?: string[];
  autoTransition?: boolean;
  scoring?: ScoringInput;
  registration?: RegistrationInput;
  branding?: BrandingInput;
};

export type UpdateEventPayload = Partial<Omit<CreateEventPayload, "format">> & {
  format?: EventFormat;
};

// Zustand UI state

export type EventView = "list" | "detail" | "leaderboard" | "settings";

export type EventUIState = {
  // Player — event list filters
  listPage: number;
  listStatusFilter: EventStatus | "all";
  listFormatFilter: EventFormat | "all";
  listSearch: string;
  listSortBy: EventSortBy;
  listSortOrder: "asc" | "desc";

  // Player — leaderboard
  leaderboardPage: number;
  leaderboardType: LeaderboardType;

  // Admin — event list
  adminPage: number;
  adminFilters: AdminEventListFilters;
  selectedEventId: string | null;

  // Admin — manage challenges panel
  isManagingChallenges: boolean;

  // Actions
  setListPage: (page: number) => void;
  setListStatusFilter: (s: EventStatus | "all") => void;
  setListFormatFilter: (f: EventFormat | "all") => void;
  setListSearch: (q: string) => void;
  setListSort: (sortBy: EventSortBy, order: "asc" | "desc") => void;
  resetListFilters: () => void;

  setLeaderboardPage: (page: number) => void;
  setLeaderboardType: (t: LeaderboardType) => void;

  setAdminPage: (page: number) => void;
  setAdminFilters: (f: Partial<AdminEventListFilters>) => void;
  resetAdminFilters: () => void;
  setSelectedEvent: (id: string | null) => void;
  setIsManagingChallenges: (v: boolean) => void;
};
