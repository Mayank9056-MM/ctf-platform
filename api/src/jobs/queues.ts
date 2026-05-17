// src/jobs/queues.ts

import { Queue, type DefaultJobOptions } from "bullmq";
import { createQueueConnection } from "../lib/redis";
import logger from "../lib/logger";

// Queue names

export const QUEUE_NAMES = {
  EMAIL: "email",
  NOTIFICATION: "notification",
  ANNOUNCEMENT: "announcement",
  LEADERBOARD: "leaderboard",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Shared default options
// Sensible defaults that can be overridden per-job at enqueue time.

const SHARED_DEFAULTS: DefaultJobOptions = {
  // Retry 3 times with exponential backoff before moving to "failed".
  // Formula: 2^attempt * 1000ms → 2s, 4s, 8s
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1_000,
  },
  // Remove completed jobs after 1 hour to prevent Redis memory growth.
  removeOnComplete: { age: 3_600 },
  // Keep failed jobs for 7 days for inspection and potential replay.
  removeOnFail: { age: 60 * 60 * 24 * 7 },
};

// Queue singletons
// Lazy-initialised so tests can start without Redis.

let _emailQueue: Queue<EmailJobData> | null = null;
let _notificationQueue: Queue<NotificationJobData> | null = null;
let _announcementQueue: Queue<AnnouncementJobData> | null = null;
let _leaderboardQueue: Queue<LeaderboardJobData> | null = null;

function makeQueue<T>(name: string): Queue<T> {
  const q = new Queue<T>(name, {
    connection: createQueueConnection(),
    defaultJobOptions: SHARED_DEFAULTS,
  });

  q.on("error", (err) => logger.error("[Queue] Error", { err, queue: name }));
  logger.info("[Queue] Initialised", { queue: name });
  return q;
}

export function getEmailQueue(): Queue<EmailJobData> {
  return (_emailQueue ??= makeQueue(QUEUE_NAMES.EMAIL));
}
export function getNotificationQueue(): Queue<NotificationJobData> {
  return (_notificationQueue ??= makeQueue(QUEUE_NAMES.NOTIFICATION));
}
export function getAnnouncementQueue(): Queue<AnnouncementJobData> {
  return (_announcementQueue ??= makeQueue(QUEUE_NAMES.ANNOUNCEMENT));
}
export function getLeaderboardQueue(): Queue<LeaderboardJobData> {
  return (_leaderboardQueue ??= makeQueue(QUEUE_NAMES.LEADERBOARD));
}

// Close all queues (call from gracefulShutdown)

export async function closeAllQueues(): Promise<void> {
  const queues = [
    _emailQueue,
    _notificationQueue,
    _announcementQueue,
    _leaderboardQueue,
  ];
  await Promise.allSettled(queues.filter(Boolean).map((q) => q!.close()));
  logger.info("[Queue] All queues closed");
}

// Job data types
// Typed at the queue level so producers and consumers share the same contract.

// Email

export type EmailJobName =
  | "send.welcome"
  | "send.password_reset"
  | "send.team_invite"
  | "send.first_blood_notification";

export type EmailJobData =
  | {
      name: "send.welcome";
      to: string;
      username: string;
    }
  | {
      name: "send.password_reset";
      to: string;
      resetToken: string;
    }
  | {
      name: "send.team_invite";
      to: string;
      inviterUsername: string;
      teamName: string;
      inviteCode: string;
    }
  | {
      name: "send.first_blood_notification";
      to: string;
      challengeTitle: string;
      username: string;
    };

// Notification

export type NotificationJobName =
  | "notification.create"
  | "notification.broadcast";

export type NotificationJobData =
  | {
      name: "notification.create";
      recipientId: string;
      type: string;
      title: string;
      body: string;
      actionUrl?: string;
    }
  | {
      name: "notification.broadcast";
      type: string;
      title: string;
      body: string;
      actionUrl?: string;
    };

// Announcement

export type AnnouncementJobName = "announcement.publish";

export type AnnouncementJobData = {
  name: "announcement.publish";
  announcementId: string;
  title: string;
  severity: string;
  audience: string;
};

// Leaderboard

export type LeaderboardJobName =
  | "leaderboard.recompute_global"
  | "leaderboard.recompute_event"
  | "leaderboard.invalidate_cache";

export type LeaderboardJobData =
  | { name: "leaderboard.recompute_global" }
  | { name: "leaderboard.recompute_event"; eventId: string }
  | { name: "leaderboard.invalidate_cache"; scope: string; eventId?: string };
