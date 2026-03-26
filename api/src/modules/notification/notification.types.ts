import { Types } from "mongoose";
import {
  NotificationChannel,
  NotificationTypeValue,
} from "../../models/notification.model";

// Shared

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Ref Sub-payload

export type NotificationRefInput = {
  challengeId?: string;
  teamId?: string;
  submissionId?: string;
  actorId?: string;
  extra?: Record<string, string | number | boolean>;
};

// Create

/**
 * Used internally by services (submission, team, admin, etc.)
 * to create a notification without going through the HTTP layer.
 */
export type CreateNotificationPayload = {
  /** null = broadcast to all users */
  recipientId: Types.ObjectId | null;
  type: NotificationTypeValue;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  actionUrl?: string;
  expiresAt?: Date;
  ref?: NotificationRefInput;
};

/**
 * Admin dispatch — same as create but accepts string IDs from request body.
 */
export type AdminDispatchPayload = {
  /** null = broadcast */
  recipientId?: string | null;
  type: NotificationTypeValue;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  actionUrl?: string;
  expiresAt?: Date;
  ref?: NotificationRefInput;
  requesterId: Types.ObjectId;
  requesterUsername: string;
};

// Player Filters

export type GetNotificationsFilters = {
  page: number;
  limit: number;
  isRead?: boolean;
  type?: NotificationTypeValue | undefined;
  /** Include broadcasts (recipient = null) alongside personal notifications */
  includeBroadcasts: boolean;
};

// Admin Filters

export type AdminNotificationFilters = {
  page: number;
  limit: number;
  recipientId?: string;
  type?: NotificationTypeValue;
  channel?: NotificationChannel;
  isRead?: boolean;
  isBroadcast?: boolean;
  from?: Date;
  to?: Date;
};

// Inbox Summary

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
    createdAt: Date;
    actionUrl?: string;
  }[];
};
