import { z } from "zod";
import { NotificationType } from "../../models/notification.model";
import {
  booleanString,
  mongoId,
  paginationBase,
} from "../../utils/validations";

// Shared

const NOTIFICATION_TYPES = Object.values(NotificationType);

const CHANNELS = ["in_app", "email", "push"] as const;

const isoDate = (label: string) =>
  z.iso
    .datetime({ message: `${label} must be a valid ISO 8601 datetime` })
    .transform((v) => new Date(v));

// Ref Sub-schema

const notificationRefSchema = z
  .object({
    challengeId: mongoId.optional(),
    teamId: mongoId.optional(),
    submissionId: mongoId.optional(),
    actorId: mongoId.optional(),
    extra: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  })
  .optional();

// Admin Dispatch

export const adminDispatchSchema = z
  .object({
    /**
     * null = broadcast to all users.
     * string ObjectId = personal notification.
     * Omitting = defaults to broadcast.
     */
    recipientId: mongoId.nullable().optional(),

    type: z.enum(NOTIFICATION_TYPES as [string, ...string[]], {
      error: () => ({
        message: `type must be one of: ${NOTIFICATION_TYPES.join(", ")}`,
      }),
    }),

    title: z
      .string()
      .min(1, "Title is required")
      .max(120, "Title cannot exceed 120 characters")
      .trim(),

    body: z
      .string()
      .min(1, "Body is required")
      .max(1000, "Body cannot exceed 1,000 characters")
      .trim(),

    channels: z
      .array(
        z.enum(CHANNELS, {
          error: () => ({
            message: "Channel must be one of: in_app, email, push",
          }),
        })
      )
      .min(1, "At least one channel must be specified")
      .optional()
      .default(["in_app"]),

    actionUrl: z
      .string()
      .url("actionUrl must be a valid URL")
      .max(500, "actionUrl cannot exceed 500 characters")
      .optional(),

    expiresAt: isoDate("expiresAt")
      .refine((d) => d > new Date(), "expiresAt must be in the future")
      .optional(),

    ref: notificationRefSchema,
  })
  .refine((d) => {
    // Broadcast notifications cannot carry in-app + email simultaneously
    // unless the admin explicitly requests it — this is just a soft warning,
    // not a hard block. No cross-field refine needed here.
    return true;
  });

// Player: Get My Notifications

export const getNotificationsSchema = z.object({
  ...paginationBase,

  isRead: booleanString,

  type: z.enum(NOTIFICATION_TYPES).optional(),

  includeBroadcasts: z
    .string()
    .optional()
    .transform((v) => v !== "false") // default true
    .pipe(z.boolean()),
});

// Admin: Filter Schema

export const adminNotificationFiltersSchema = z
  .object({
    ...paginationBase,

    recipientId: mongoId.optional(),

    type: z.enum(NOTIFICATION_TYPES).optional(),

    channel: z.enum(CHANNELS).optional(),

    isRead: booleanString,

    isBroadcast: booleanString,

    from: isoDate("from").optional(),

    to: isoDate("to").optional(),
  })
  .refine(
    (d) => {
      if (d.from && d.to) return d.from <= d.to;
      return true;
    },
    { message: "from must be before or equal to to", path: ["from"] }
  );

// Mark as Read

export const markReadSchema = z.object({
  /** Pass specific IDs to mark. Omit to mark all unread. */
  notificationIds: z
    .array(mongoId)
    .min(1, "Provide at least one notificationId")
    .optional(),
});

// Dismiss Broadcast

// No body needed — notificationId comes from :id param.
// Validator provided for consistency in controller pattern.
export const dismissBroadcastSchema = z.object({});
