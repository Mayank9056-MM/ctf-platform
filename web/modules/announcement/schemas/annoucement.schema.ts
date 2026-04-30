// modules/announcements/validations/announcement.schema.ts
import { error } from "console";
import { z } from "zod";

const SEVERITIES = ["info", "success", "warning", "critical"] as const;
const AUDIENCES = ["all", "teams", "solo", "specific"] as const;

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

const paginationBase = {
  page: z
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(20),
};

// Create

export const createAnnouncementSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title must be under 150 characters")
      .trim(),

    body: z
      .string()
      .min(10, "Body must be at least 10 characters")
      .max(5000, "Body must be under 5,000 characters")
      .trim(),

    severity: z.enum(SEVERITIES, {
      error: () => ({
        message: `Severity must be one of: ${SEVERITIES.join(", ")}`,
      }),
    }),

    audience: z.enum(AUDIENCES, {
      error: () => ({
        message: `Audience must be one of: ${AUDIENCES.join(", ")}`,
      }),
    }),

    targetUsers: z
      .array(mongoId, {
        error: "targetUsers must be an array of valid ObjectIds",
      })
      .min(1, "targetUsers must contain at least one user ID")
      .optional(),

    challengeId: mongoId.optional(),

    actionUrl: z
      .url("actionUrl must be a valid URL")
      .max(500, "actionUrl cannot exceed 500 characters")
      .optional(),

    actionLabel: z
      .string()
      .max(60, "actionLabel cannot exceed 60 characters")
      .trim()
      .optional(),

    expiresAt: z.iso
      .datetime({ error: "expiresAt must be a valid ISO 8601 datetime" })
      .refine(
        (s) => new Date(s) > new Date(),
        "expiresAt must be in the future",
      )
      .optional(),

    publishImmediately: z.boolean(),
  })
  // Rule 1: "specific" audience must carry targetUsers
  .refine(
    (d) => d.audience !== "specific" || (d.targetUsers?.length ?? 0) > 0,
    {
      message: "targetUsers is required when audience is 'specific'",
      path: ["targetUsers"],
    },
  )
  // Rule 2: actionUrl and actionLabel must both be present or both absent
  .refine((d) => !d.actionUrl || !!d.actionLabel, {
    message: "actionLabel is required when actionUrl is provided",
    path: ["actionLabel"],
  })
  .refine((d) => !d.actionLabel || !!d.actionUrl, {
    message: "actionUrl is required when actionLabel is provided",
    path: ["actionUrl"],
  });

export type CreateAnnouncementFormData = z.infer<
  typeof createAnnouncementSchema
>;

// Update

export const updateAnnouncementSchema = z
  .object({
    title: z.string().min(3).max(150).trim().optional(),

    body: z.string().min(10).max(5000).trim().optional(),

    severity: z.enum(SEVERITIES).optional(),

    audience: z.enum(AUDIENCES).optional(),

    targetUsers: z.array(mongoId).optional(),

    challengeId: mongoId.nullable().optional(),

    actionUrl: z
      .url()
      .max(500, "actionUrl cannot exceed 500 characters")
      .nullable()
      .optional(),

    actionLabel: z.string().max(60).trim().nullable().optional(),

    expiresAt: z.iso
      .datetime({ error: "expiresAt must be a valid ISO 8601 datetime" })
      .refine(
        (s) => new Date(s) > new Date(),
        "expiresAt must be in the future",
      )
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (d) =>
      d.audience === undefined ||
      d.audience !== "specific" ||
      (d.targetUsers?.length ?? 0) > 0,
    {
      message: "targetUsers is required when audience is 'specific'",
      path: ["targetUsers"],
    },
  );

export type UpdateAnnouncementFormData = z.infer<
  typeof updateAnnouncementSchema
>;

// Retract

export const retractAnnouncementSchema = z.object({
  reason: z
    .string()
    .max(300, "Retraction reason cannot exceed 300 characters")
    .trim()
    .optional(),
});

export type RetractAnnouncementFormData = z.infer<
  typeof retractAnnouncementSchema
>;

// Player feed filters

export const feedFiltersSchema = z.object({
  ...paginationBase,
  severity: z.enum(SEVERITIES).optional(),
  challengeId: mongoId.optional(),
});

export type FeedFiltersFormData = z.infer<typeof feedFiltersSchema>;

// Admin filters

export const adminFiltersSchema = z
  .object({
    ...paginationBase,
    isPublished: z.boolean().optional(),
    isRetracted: z.boolean().optional(),
    severity: z.enum(SEVERITIES).optional(),
    audience: z.enum(AUDIENCES).optional(),
    authorId: mongoId.optional(),
    challengeId: mongoId.optional(),
    search: z
      .string()
      .max(100, "Search must be under 100 characters")
      .trim()
      .optional(),
    from: z
      .string()
      .datetime({ message: "from must be a valid ISO 8601 datetime" })
      .optional(),
    to: z
      .string()
      .datetime({ message: "to must be a valid ISO 8601 datetime" })
      .optional(),
    sortBy: z
      .enum(["publishedAt", "createdAt", "severity"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .refine(
    (d) => {
      if (d.from && d.to) return new Date(d.from) <= new Date(d.to);
      return true;
    },
    { message: "from must be before or equal to to", path: ["from"] },
  );

export type AdminFiltersFormData = z.infer<typeof adminFiltersSchema>;
