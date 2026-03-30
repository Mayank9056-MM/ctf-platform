export type TeamMemberRole = "owner" | "member";

export interface TeamMember {
  userId: string;
  username: string;
  avatar?: string;
  role: TeamMemberRole;
  joinedAt: string;
  points?: number;
}

export interface MyTeam {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  score: number;
  members: TeamMember[];
  maxMembers: number;
  joinCodeExpire?: string | null;
  createdAt: string;

  owner: {
    _id: string;
    username: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };

  isActive: boolean;
  isPrivate: boolean;
  invites: unknown[];
  solvedChallenges: string[];
  updatedAt: string;
  country?: string | null;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  isPrivate?: boolean;
  country?: string;
}

export interface SearchTeamPayload {
  q?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: "score" | "memberCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export type SearchTeamsResponse = {
  teams: MyTeam[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};