import { z } from "zod";

// Shared

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const paginationBase = {
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(
      z
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
    ),
};

const isoDate = z.iso
  .datetime("Invalid ISO 8601 datetime")
  .transform((v) => new Date(v));

const booleanString = z
  .string()
  .optional()
  .transform((v) => (v === "true" ? true : v === "false" ? false : undefined));

// Submit flag

export const submitFlagSchema = z.object({
  flag: z
    .string({ error: "Flag is required" })
    .min(1, "Flag is required")
    .max(500, "Flag cannot exceed 500 characters")
    .trim(),
});

export const mySubmissionsSchema = z.object({
  ...paginationBase,
  isCorrect: booleanString,
  challengeId: mongoId.optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const submissionHistorySchema = z.object({
  ...paginationBase,
});

export const adminSubmissionFilterSchema = z
  .object({
    ...paginationBase,
    isCorrect: booleanString,
    isFirstBlood: booleanString,
    userId: mongoId.optional(),
    teamId: mongoId.optional(),
    challengeId: mongoId.optional(),
    ipaAddress: z.ipv4().or(z.ipv6()).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    sortBy: z
      .enum(["createdAd", "pointsAwarded"])
      .optional()
      .default("createdAd"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .refine(
    (d) => {
      if (d.from && d.to) {
        return d.from <= d.to;
      }
      return true;
    },
    { error: "from must be before or equal to to", path: ["from"] }
  );

export const adminStatsFiltersSchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  challengeId: mongoId.optional(),
});
