import { Types } from "mongoose";

export type createTeamInput = {
  name: string;
  description?: string;
  isPrivate?: boolean;
  country?: string;
  ownerId: Types.ObjectId;
};

export type updateTeamInput = {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  country?: string;
  avatar?: string;
  maxMembers?: number;
  requesterId: Types.ObjectId;
  teamId: string;
};

export interface SearchTeamInput {
  q?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: "score" | "memberCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}
