import { z } from "zod";
import {
  booleanString,
  mongoId,
  paginationBase,
} from "../../utils/validations";

// Shared

const isoDate = (label: string) =>
  z.iso
    .datetime({ message: `${label} must be a valid ISO 8601 datetime` })
    .transform((v) => new Date(v));

const SEVERITIES = ["info", "success", "warning", "critical"] as const;
const AUDIENCES = ["all", "teams", "solo", "specific"] as const;

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

    severity: z
      .enum(SEVERITIES, {
        error: () => ({
          message: `Severity must be one of: ${SEVERITIES.join(", ")}`,
        }),
      })
      .optional()
      .default("info"),

    audience: z
      .enum(AUDIENCES, {
        error: () => ({
          message: `Audience must be one of: ${AUDIENCES.join(", ")}`,
        }),
      })
      .optional()
      .default("all"),

    targetUsers: z
      .array(mongoId, {
        error: "targetUsers must be an array of valid ObjectIds",
      })
      .min(1, "targetUsers must contain at least one user ID")
      .optional(),

    challengeId: mongoId.optional(),

    actionUrl: z
      .string()
      .url("actionUrl must be a valid URL")
      .max(500, "actionUrl cannot exceed 500 characters")
      .optional(),

    actionLabel: z
      .string()
      .max(60, "actionLabel cannot exceed 60 characters")
      .trim()
      .optional(),

    expiresAt: isoDate("expiresAt")
      .refine((d) => d > new Date(), "expiresAt must be in the future")
      .optional(),

    publishImmediately: z.boolean().optional().default(false),
  })
  // Rule 1: audience "specific" requires targetUsers
  .refine(
    (d) => d.audience !== "specific" || (d.targetUsers?.length ?? 0) > 0,
    {
      message: "targetUsers is required when audience is 'specific'",
      path: ["targetUsers"],
    }
  )
  // Rule 2: actionUrl and actionLabel must be provided together
  .refine((d) => !d.actionUrl || !!d.actionLabel, {
    message: "actionLabel is required when actionUrl is provided",
    path: ["actionLabel"],
  })
  .refine((d) => !d.actionLabel || !!d.actionUrl, {
    message: "actionUrl is required when actionLabel is provided",
    path: ["actionUrl"],
  });

// Update

export const updateAnnouncementSchema = z
  .object({
    title: z.string().min(3).max(150).trim().optional(),

    body: z.string().min(10).max(5000).trim().optional(),

    severity: z.enum(SEVERITIES).optional(),

    audience: z.enum(AUDIENCES).optional(),

    targetUsers: z.array(mongoId).optional(),

    challengeId: mongoId.nullable().optional(),

    actionUrl: z.string().url().max(500).nullable().optional(),

    actionLabel: z.string().max(60).trim().nullable().optional(),

    expiresAt: isoDate("expiresAt")
      .refine((d) => d > new Date(), "expiresAt must be in the future")
      .nullable()
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
    }
  );

// Retract

export const retractAnnouncementSchema = z.object({
  reason: z
    .string()
    .max(300, "Retraction reason cannot exceed 300 characters")
    .trim()
    .optional(),
});

// Player Feed Filters

export const feedFiltersSchema = z.object({
  ...paginationBase,

  severity: z.enum(SEVERITIES).optional(),

  challengeId: mongoId.optional(),
});

// Admin Filters

export const adminAnnouncementFiltersSchema = z
  .object({
    ...paginationBase,

    isPublished: booleanString,

    isRetracted: booleanString,

    severity: z.enum(SEVERITIES).optional(),

    audience: z.enum(AUDIENCES).optional(),

    authorId: mongoId.optional(),

    challengeId: mongoId.optional(),

    search: z
      .string()
      .max(100, "Search must be under 100 characters")
      .trim()
      .optional(),

    from: isoDate("from").optional(),

    to: isoDate("to").optional(),

    sortBy: z
      .enum(["publishedAt", "createdAt", "severity"])
      .optional()
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .refine(
    (d) => {
      if (d.from && d.to) return d.from <= d.to;
      return true;
    },
    { message: "from must be before or equal to to", path: ["from"] }
  );
