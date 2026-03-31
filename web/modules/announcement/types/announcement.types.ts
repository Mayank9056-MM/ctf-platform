export const ANNOUNCEMENT_SEVERITIES = [
  "info",
  "success",
  "warning",
  "critical",
] as const;

export const ANNOUNCEMENT_AUDIENCES = [
  "all",
  "teams",
  "solo",
  "specific",
] as const;

export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

// Core Announcement

export type AnnouncementAuthor = {
  _id: string;
  username: string;
  avatar?: { url: string };
  /** Only present on admin view */
  email?: string;
  role?: string;
};

export type AnnouncementChallenge = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  difficulty?: string;
};

export type Announcement = {
  _id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  author: AnnouncementAuthor;
  targetUsers?: string[];
  challenge?: AnnouncementChallenge | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  expiresAt?: string | null;
  isPublished: boolean;
  isRetracted: boolean;
  retractedAt?: string | null;
  retractionReason?: string | null;
  notificationDispatched: boolean;
  publishedAt?: string | null;
  /** How many users dismissed this announcement */
  dismissedCount?: number;
  /** Whether the current user dismissed this (annotated by server) */
  isDismissed?: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  isLive?: boolean;
  isExpired?: boolean;
};

// Feed item (lighter shape returned by the player feed)

export type AnnouncementFeedItem = Pick<
  Announcement,
  | "_id"
  | "title"
  | "body"
  | "severity"
  | "audience"
  | "author"
  | "challenge"
  | "actionUrl"
  | "actionLabel"
  | "expiresAt"
  | "publishedAt"
  | "isDismissed"
  | "isLive"
>;

// Pagination

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Feed response

export type AnnouncementFeed = {
  announcements: AnnouncementFeedItem[];
  meta: PaginationMeta;
};

export type AdminAnnouncementList = {
  announcements: Announcement[];
  meta: PaginationMeta;
};

// Stats

export type AnnouncementStats = {
  total: number;
  published: number;
  draft: number;
  retracted: number;
  expired: number;
  bySeverity: { severity: AnnouncementSeverity; count: number }[];
  byAudience: { audience: AnnouncementAudience; count: number }[];
  pendingDispatch: number;
  avgDismissRate: number;
};

// Filter types

export type AnnouncementFeedFilters = {
  page?: number;
  limit?: number;
  severity?: AnnouncementSeverity;
  challengeId?: string;
};

export type AdminAnnouncementFilters = {
  page?: number;
  limit?: number;
  isPublished?: boolean;
  isRetracted?: boolean;
  severity?: AnnouncementSeverity;
  audience?: AnnouncementAudience;
  authorId?: string;
  challengeId?: string;
  search?: string;
  from?: string; // ISO string
  to?: string;
  sortBy?: "publishedAt" | "createdAt" | "severity";
  sortOrder?: "asc" | "desc";
};

// Request payload types

export type CreateAnnouncementPayload = {
  title: string;
  body: string;
  severity?: AnnouncementSeverity;
  audience?: AnnouncementAudience;
  targetUsers?: string[];
  challengeId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: string; // ISO string
  publishImmediately?: boolean;
};

export type UpdateAnnouncementPayload = {
  title?: string;
  body?: string;
  severity?: AnnouncementSeverity;
  audience?: AnnouncementAudience;
  targetUsers?: string[];
  challengeId?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  expiresAt?: string | null;
};

export type RetractAnnouncementPayload = {
  reason?: string;
};

// Zustand UI state

export type AnnouncementUIState = {
  // Feed
  feedPage: number;
  feedSeverityFilter: AnnouncementSeverity | "all";
  dismissedIds: Set<string>; // optimistic — IDs dismissed this session

  // Admin
  adminPage: number;
  adminFilters: AdminAnnouncementFilters;
  selectedAnnouncementId: string | null;

  // Actions
  setFeedPage: (page: number) => void;
  setFeedSeverityFilter: (s: AnnouncementSeverity | "all") => void;
  optimisticDismiss: (id: string) => void;
  setAdminPage: (page: number) => void;
  setAdminFilters: (f: Partial<AdminAnnouncementFilters>) => void;
  resetAdminFilters: () => void;
  setSelectedAnnouncement: (id: string | null) => void;
};