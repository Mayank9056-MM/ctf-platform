// Enums

export const NOTIFICATION_TYPES = {
  CHALLENGE_PUBLISHED: "challenge_published",
  CHALLENGE_CLOSED: "challenge_closed",
  CHALLENGE_HINT_ADDED: "challenge_hint_added",
  SUBMISSION_CORRECT: "submission_correct",
  SUBMISSION_FIRST_BLOOD: "submission_first_blood",
  TEAM_INVITE_RECEIVED: "team_invite_received",
  TEAM_INVITE_ACCEPTED: "team_invite_accepted",
  TEAM_INVITE_DECLINED: "team_invite_declined",
  TEAM_MEMBER_LEFT: "team_member_left",
  TEAM_CHALLENGE_SOLVED: "team_challenge_solved",
  ACCOUNT_SCORE_UPDATED: "account_score_updated",
  ACCOUNT_BANNED: "account_banned",
  ACCOUNT_UNBANNED: "account_unbanned",
  ACCOUNT_EMAIL_VERIFIED: "account_email_verified",
  ADMIN_ANNOUNCEMENT: "admin_announcement",
  EVENT_STARTING_SOON: "event_starting_soon",
  EVENT_ENDED: "event_ended",
} as const;

export type NotificationTypeValue =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export type NotificationChannel = "in_app" | "email" | "push";

// Ref

export type NotificationRef = {
  challengeId?: string;
  teamId?: string;
  submissionId?: string;
  actorId?: string;
  extra?: Record<string, string | number | boolean>;
};

// Notification document

export type AppNotification = {
  _id: string;
  /** null = broadcast */
  recipient: string | null;
  type: NotificationTypeValue;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  channels: NotificationChannel[];
  ref: NotificationRef;
  dismissedBy?: string[];
  actionUrl?: string | null;
  expiresAt?: string | null;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  // virtuals
  isExpired?: boolean;
  isBroadcast?: boolean;
  // annotated by the hook — whether the current user dismissed this broadcast
  isDismissed?: boolean;
};

// Inbox summary

export type InboxSummary = {
  unreadCount: number;
  personalUnread: number;
  broadcastUnread: number;
  latestNotifications: {
    _id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  }[];
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

export type NotificationList = {
  notifications: AppNotification[];
  meta: PaginationMeta;
};

// Admin stat

export type NotificationStats = {
  total: number;
  broadcasts: number;
  unread: number;
  byType: { _id: string; count: number; readCount: number }[];
  byChannel: { _id: NotificationChannel; count: number }[];
  recentActivity: { date: string; count: number }[];
};

// Filter / Request types

export type GetNotificationsFilters = {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationTypeValue;
  includeBroadcasts?: boolean;
};

export type AdminNotificationFilters = {
  page?: number;
  limit?: number;
  recipientId?: string;
  type?: NotificationTypeValue;
  channel?: NotificationChannel;
  isRead?: boolean;
  isBroadcast?: boolean;
  from?: string; // ISO string
  to?: string;
};

export type AdminDispatchPayload = {
  recipientId?: string | null;
  type: NotificationTypeValue;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  actionUrl?: string;
  expiresAt?: string; // ISO string
  ref?: {
    challengeId?: string;
    teamId?: string;
    submissionId?: string;
    actorId?: string;
    extra?: Record<string, string | number | boolean>;
  };
};

// Zustand UI state

export type NotificationUIState = {
  // Bell panel
  isPanelOpen: boolean;
  panelTab: "all" | "unread";

  // Full inbox page
  inboxPage: number;
  inboxFilter: "all" | "unread";
  inboxTypeFilter: NotificationTypeValue | "all";

  // Optimistic — IDs dismissed/deleted this session
  optimisticDismissedIds: Set<string>;
  optimisticDeletedIds: Set<string>;

  // Admin
  adminPage: number;
  adminFilters: AdminNotificationFilters;
  selectedNotificationId: string | null;

  // Actions
  togglePanel: () => void;
  closePanel: () => void;
  setPanelTab: (tab: "all" | "unread") => void;
  setInboxPage: (page: number) => void;
  setInboxFilter: (f: "all" | "unread") => void;
  setInboxTypeFilter: (t: NotificationTypeValue | "all") => void;
  optimisticallyDismiss: (id: string) => void;
  optimisticallyDelete: (id: string) => void;
  clearOptimistic: () => void;
  setAdminPage: (page: number) => void;
  setAdminFilters: (f: Partial<AdminNotificationFilters>) => void;
  resetAdminFilters: () => void;
  setSelectedNotification: (id: string | null) => void;
};
