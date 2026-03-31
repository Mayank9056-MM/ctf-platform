import { z } from "zod";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

const isoDate = z.iso.datetime({
  message: "Must be a valid ISO 8601 datetime",
});

const paginationBase = {
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
};

// Submit flag

export const submitFlagSchema = z.object({
  flag: z
    .string({ message: "Flag is required" })
    .min(1, "Flag is required")
    .max(500, "Flag cannot exceed 500 characters")
    .trim(),
});

export type SubmitFlagFormData = z.infer<typeof submitFlagSchema>;

// My submissions

export const mySubmissionsSchema = z.object({
  ...paginationBase,
  isCorrect: z.boolean().optional(),
  challengeId: mongoId.optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type MySubmissionsFormData = z.infer<typeof mySubmissionsSchema>;

// Challenge history

export const submissionHistorySchema = z.object({
  ...paginationBase,
});

export type SubmissionHistoryFormData = z.infer<typeof submissionHistorySchema>;

// Admin filters

export const adminSubmissionFilterSchema = z
  .object({
    ...paginationBase,
    isCorrect: z.boolean().optional(),
    isFirstBlood: z.boolean().optional(),
    userId: mongoId.optional(),
    teamId: mongoId.optional(),
    challengeId: mongoId.optional(),
    ipAddress: z.ipv4().or(z.ipv6()).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    sortBy: z
      .enum(["createdAt", "pointsAwarded"])
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

export type AdminSubmissionFilterData = z.infer<
  typeof adminSubmissionFilterSchema
>;

// Admin stats filters

export const adminStatsFiltersSchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    challengeId: mongoId.optional(),
  })
  .refine(
    (d) => {
      if (d.from && d.to) return new Date(d.from) <= new Date(d.to);
      return true;
    },
    { message: "from must be before or equal to to", path: ["from"] },
  );

export type AdminStatsFiltersData = z.infer<typeof adminStatsFiltersSchema>;
