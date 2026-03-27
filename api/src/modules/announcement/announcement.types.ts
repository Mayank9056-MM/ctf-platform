import { Types } from "mongoose";
import {
  AnnouncementAudience,
  AnnouncementSeverity,
} from "../../models/anouncement.model";

// Shared

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Create

export type CreateAnnouncementPayload = {
  title: string;
  body: string;
  severity?: AnnouncementSeverity;
  audience?: AnnouncementAudience;
  /** Required and non-empty when audience === "specific" */
  targetUsers?: string[];
  /** Related challenge ObjectId */
  challengeId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  /**
   * When true, the announcement is published immediately on creation.
   * When false (default), it is saved as a draft.
   */
  publishImmediately?: boolean;
  authorId: Types.ObjectId;
  authorUsername: string;
};

// Update

export type UpdateAnnouncementPayload = {
  announcementId: string;
  title?: string;
  body?: string;
  severity?: AnnouncementSeverity;
  audience?: AnnouncementAudience;
  targetUsers?: string[];
  challengeId?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  expiresAt?: Date | null;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Retract

export type RetractAnnouncementPayload = {
  announcementId: string;
  reason?: string;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Player Filters

/**
 * Used for the participant-facing feed.
 * Server applies: isPublished, isRetracted, audience, dismissedBy, expiry.
 */
export type AnnouncementFeedFilters = {
  page: number;
  limit: number;
  severity?: AnnouncementSeverity;
  challengeId?: string;
};

// Admin Filters

export type AdminAnnouncementFilters = {
  page: number;
  limit: number;
  isPublished?: boolean;
  isRetracted?: boolean;
  severity?: AnnouncementSeverity;
  audience?: AnnouncementAudience;
  authorId?: string;
  challengeId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  sortBy: "publishedAt" | "createdAt" | "severity";
  sortOrder: "asc" | "desc";
};

// Stats

export type AnnouncementStats = {
  total: number;
  published: number;
  draft: number;
  retracted: number;
  expired: number;
  bySeverity: { severity: string; count: number }[];
  byAudience: { audience: string; count: number }[];
  pendingDispatch: number;
  avgDismissRate: number;
};
