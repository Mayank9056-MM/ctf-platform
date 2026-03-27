import { z } from "zod";
import {
  booleanString,
  isoDate,
  mongoId,
  paginationBase,
} from "../../utils/validations";

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
      .enum(["createdAt", "pointsAwarded"])
      .optional()
      .default("createdAt"),
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
