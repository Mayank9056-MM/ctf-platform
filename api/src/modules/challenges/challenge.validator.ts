import { z } from "zod";

const CATEGORIES = [
  "web",
  "pwn",
  "crypto",
  "forensics",
  "reversing",
  "misc",
  "osint",
  "blockchain",
  "hardware",
  "cloud",
] as const;

const DIFFICULTIES = ["easy", "medium", "hard", "insane"] as const;

const flagField = z
  .string()
  .min(1, "Flag cannot be empty")
  .max(500, "Flag cannot exceed 500 characters")
  .trim();

const tagsField = z
  .array(
    z
      .string()
      .max(30, "Each tag must be under 30 characters")
      .toLowerCase()
      .trim()
  )
  .max(10, "Cannot have more than 10 tags")
  .optional();

// challenge filter
export const challengeFilterSchema = z.object({
  category: z.enum(CATEGORIES).optional(),

  difficulty: z.enum(DIFFICULTIES).optional(),

  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : undefined
    ),

  search: z
    .string()
    .max(100, "Search query must be under 100 characters")
    .trim()
    .optional(),

  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .pipe(z.number().int().min(1).max(100, "Limit cannot exceed 100")),

  sortBy: z
    .enum(["points", "solveCount", "publishedAt", "difficulty"])
    .optional()
    .default("points"),

  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// create challenge

export const createChallengeSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be under 30 characters")
      .trim(),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(10000, "Description must be under 10,000 characters")
      .trim(),

    category: z.enum(CATEGORIES, {
      error: () => ({
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      }),
    }),

    difficulty: z.enum(DIFFICULTIES, {
      error: () => ({
        message: `Difficulty must be one of: ${DIFFICULTIES.join(", ")}`,
      }),
    }),

    points: z
      .number({ error: () => ({ message: "Points must be a number" }) })
      .int("Points must be an integer")
      .min(1, "Points must be at least 1")
      .max(10000, "Points must be at most 10000"),

    flag: flagField,

    scoringType: z.enum(["static", "dynamic"]).default("dynamic"),

    minPoints: z
      .number()
      .int("Min points must be an integer")
      .min(1, "Min points must be at least 1")
      .optional()
      .default(100),

    isCaseSensitive: z.boolean().default(true),

    tags: tagsField,

    isHosted: z.boolean().default(false),
  })
  .refine((data) => !data.minPoints || data.minPoints <= data.points, {
    message: "minPoints must be less than or equal to points",
    path: ["minPoints"],
  });

// Update challenge

export const updateChallengeSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be under 100 characters")
      .trim()
      .optional(),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(10000, "Description must be under 10,000 characters")
      .trim()
      .optional(),

    category: z
      .enum(CATEGORIES, {
        error: () => ({
          message: `Category must be one of: ${CATEGORIES.join(", ")}`,
        }),
      })
      .optional(),

    difficulty: z
      .enum(DIFFICULTIES, {
        error: () => ({
          message: `Difficulty must be one of: ${DIFFICULTIES.join(", ")}`,
        }),
      })
      .optional(),

    points: z
      .number()
      .int("Points must be a whole number")
      .min(1, "Points must be at least 1")
      .max(10000, "Points cannot exceed 10,000")
      .optional(),

    flag: flagField.optional(),
    scoringType: z.enum(["static", "dynamic"]).optional(),

    minPoints: z
      .number()
      .int("Min points must be a whole number")
      .min(1, "Min points must be at least 1")
      .optional(),

    flagFormat: z
      .string()
      .max(50, "Flag format hint must be under 50 characters")
      .trim()
      .nullable()
      .optional(),

    isCaseSensitive: z.boolean().optional(),

    tags: tagsField,

    isHosted: z.boolean().optional(),

    isVisible: z.boolean().optional(),

    closedAt: z.iso
      .datetime()
      .transform((v) => new Date(v))
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) =>
      data.minPoints === undefined ||
      data.points === undefined ||
      data.minPoints <= data.points,
    {
      message: "minPoints cannot exceed base points",
      path: ["minPoints"],
    }
  );

// Submit flag

export const submitFlagSchema = z.object({
  flag: flagField,
});

// Purchase hint

export const purchaseHintSchema = z.object({
  hintIndex: z
    .number({ error: "hintIndex is required" })
    .int("hintIndex must be a whole number")
    .min(0, "hintIndex must be 0 or greater"),
});

// add hint (admin)

export const addHintSchema = z.object({
  text: z
    .string()
    .min(1, "Hint text cannot be empty")
    .max(500, "Hint text must be under 500 characters")
    .trim(),

  cost: z
    .number()
    .int("Hint cost must be a whole number")
    .min(0, "Hint cost cannot be negative")
    .max(5000, "Hint cost cannot exceed 5,000"),

  order: z
    .number()
    .int("Order must be a whole number")
    .min(1, "Order must be at least 1"),
});

// add attachment (admin)

export const addAttachmentSchema = z.object({
  name: z
    .string()
    .min(1, "Attachment name cannot be empty")
    .max(100, "Attachment name must be under 100 characters")
    .trim(),

  url: z.string().url("Attachment URL must be a valid URL"),

  size: z
    .number()
    .int("File size must be a whole number")
    .min(0, "File size cannot be negative"),

  mimeType: z
    .string()
    .min(1, "MIME type is required")
    .max(100, "MIME type must be under 100 characters"),
});
