import { z } from "zod";
import { NOTIFICATION_TYPES } from "../types/notification.types";

// Shared 

const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES) as [
  string,
  ...string[]
];

const CHANNELS = ["in_app", "email", "push"] as const;

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

const paginationBase = {
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
};

// Ref sub-schema 

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

// Admin dispatch 

export const adminDispatchSchema = z.object({
  recipientId: mongoId.nullable().optional(),

  type: z.enum(NOTIFICATION_TYPE_VALUES, {
    error: () => ({
      message: `type must be one of: ${NOTIFICATION_TYPE_VALUES.join(", ")}`,
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

  expiresAt: z
    .string()
    .datetime({ message: "expiresAt must be a valid ISO 8601 datetime" })
    .refine(
      (v) => new Date(v) > new Date(),
      "expiresAt must be in the future"
    )
    .optional(),

  ref: notificationRefSchema,
});

export type AdminDispatchFormData = z.infer<typeof adminDispatchSchema>;

// Player: inbox filters 

export const getNotificationsSchema = z.object({
  ...paginationBase,
  isRead: z.boolean().optional(),
  type: z.enum(NOTIFICATION_TYPE_VALUES).optional(),
  includeBroadcasts: z.boolean().optional().default(true),
});

export type GetNotificationsFormData = z.infer<typeof getNotificationsSchema>;

// Player: mark as read 

export const markReadSchema = z.object({
  /** Omit to mark ALL unread */
  notificationIds: z
    .array(mongoId)
    .min(1, "Provide at least one notificationId")
    .optional(),
});

export type MarkReadFormData = z.infer<typeof markReadSchema>;

// Admin: filter schema

export const adminNotificationFiltersSchema = z
  .object({
    ...paginationBase,
    recipientId: mongoId.optional(),
    type: z.enum(NOTIFICATION_TYPE_VALUES).optional(),
    channel: z.enum(CHANNELS).optional(),
    isRead: z.boolean().optional(),
    isBroadcast: z.boolean().optional(),
    from: z
      .string()
      .datetime({ message: "from must be a valid ISO 8601 datetime" })
      .optional(),
    to: z
      .string()
      .datetime({ message: "to must be a valid ISO 8601 datetime" })
      .optional(),
  })
  .refine(
    (d) => {
      if (d.from && d.to) return new Date(d.from) <= new Date(d.to);
      return true;
    },
    { message: "from must be before or equal to to", path: ["from"] }
  );

export type AdminNotificationFiltersFormData = z.infer<
  typeof adminNotificationFiltersSchema
>;