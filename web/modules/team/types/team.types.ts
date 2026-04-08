// Sub-document types

import {
  TEAM_SORT_OPTIONS,
  TEAM_SORT_ORDERS,
} from "../constants/team.constants";

export type TeamMemberUser = {
  _id: string;
  username: string;
  avatar?: { url: string; publicId?: string };
  score: number;
  country?: string;
  solvedChallenges?: string[];
};

export type TeamOwner = {
  _id: string;
  username: string;
  avatar?: { url: string };
};

export type TeamInvite = {
  user: string | TeamMemberUser;
  invitedBy: string | TeamOwner;
  invitedAt: string;
};

// Full Team

export type Team = {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner: TeamOwner;
  members: TeamMemberUser[];
  /** Only present on getMyTeam (includeInvites = true) */
  invites?: TeamInvite[];
  score: number;
  maxMembers: number;
  isPrivate: boolean;
  isActive: boolean;
  country?: string;
  /** Only present for team owner */
  joinCode?: string;
  joinCodeExpire?: string;
  solvedChallenges: string[];
  createdAt: string;
  updatedAt: string;
  // Computed by server
  memberCount?: number;
};

// Search result

export type TeamSearchResult = {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner: TeamOwner;
  members: TeamMemberUser[];
  /** Only present on getMyTeam (includeInvites = true) */
  invites?: TeamInvite[];
  score: number;
  maxMembers: number;
  isPrivate: boolean;
  isActive: boolean;
  country?: string;
  /** Only present for team owner */
  joinCode?: string;
  joinCodeExpire?: string;
  solvedChallenges: string[];
  createdAt: string;
  updatedAt: string;
  // Computed by server
  memberCount?: number;
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

export type TeamSearchResponse = {
  teams: TeamSearchResult[];
  meta: PaginationMeta;
};

// Request payloads

export type CreateTeamPayload = {
  name: string;
  description?: string;
  isPrivate?: boolean;
  country?: string;
};

export type UpdateTeamPayload = {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  country?: string;
  maxMembers?: number;
};

export type SearchTeamParams = {
  q?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: (typeof TEAM_SORT_OPTIONS)[number];
  sortOrder?: (typeof TEAM_SORT_ORDERS)[number];
};

// Zustand UI state

export type TeamView = "my-team" | "search" | "join" | "invites" | "settings";

export type TeamUIState = {
  // Dashboard / team panel
  activeView: TeamView;
  searchQuery: string;
  joinCodeInput: string;
  inviteUsernameInput: string;

  // Search page
  searchPage: number;
  searchCountry: string | null;
  searchSortBy: (typeof TEAM_SORT_OPTIONS)[number];
  searchSortOrder: (typeof TEAM_SORT_ORDERS)[number];

  // Settings panel
  isEditingTeam: boolean;

  // Actions
  setActiveView: (v: TeamView) => void;
  setSearchQuery: (q: string) => void;
  setJoinCodeInput: (code: string) => void;
  setInviteUsernameInput: (username: string) => void;
  setSearchPage: (page: number) => void;
  setSearchCountry: (country: string | null) => void;
  setSearchSortBy: (sortBy: (typeof TEAM_SORT_OPTIONS)[number]) => void;
  setSearchSortOrder: (order: (typeof TEAM_SORT_ORDERS)[number]) => void;
  setIsEditingTeam: (v: boolean) => void;
  resetSearchState: () => void;
  resetInputs: () => void;
};
