import { z } from "zod";

export const CATEGORIES = [
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

export const DIFFICULTIES = ["easy", "medium", "hard", "insane"] as const;

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
      .trim(),
  )
  .max(10, "Cannot have more than 10 tags")
  .optional();

// Challenge filters

export const challengeFilterSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  tags: z.string().optional(),
  search: z
    .string()
    .max(100, "Search query must be under 100 characters")
    .trim()
    .optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
  sortBy: z
    .enum(["points", "solveCount", "publishedAt", "difficulty"])
    .optional()
    .default("points"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type ChallengeFilterValues = z.infer<typeof challengeFilterSchema>;

// Create challenge (admin)

export const createChallengeSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be under 100 characters")
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
      .number({ error: "Points must be a number" })
      .int("Points must be an integer")
      .min(1, "Points must be at least 1")
      .max(10000, "Points must be at most 10,000"),

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
  .refine((d) => d.minPoints === undefined || d.minPoints <= d.points, {
    message: "minPoints must be less than or equal to points",
    path: ["minPoints"],
  });

export type CreateChallengeFormData = z.infer<typeof createChallengeSchema>;

// Update challenge (admin)

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

    category: z.enum(CATEGORIES).optional(),

    difficulty: z.enum(DIFFICULTIES).optional(),

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
      .max(50, "Flag format must be under 50 characters")
      .trim()
      .nullable()
      .optional(),

    isCaseSensitive: z.boolean().optional(),

    tags: tagsField,

    isHosted: z.boolean().optional(),

    isVisible: z.boolean().optional(),

    closedAt: z.iso
      .datetime({ message: "closedAt must be a valid ISO 8601 datetime" })
      .nullable()
      .optional(),
  })
  .refine(
    (d) =>
      Object.keys(d).filter((k) => d[k as keyof typeof d] !== undefined)
        .length > 0,
    {
      message: "At least one field must be provided for update",
    },
  )
  .refine(
    (d) =>
      d.minPoints === undefined ||
      d.points === undefined ||
      d.minPoints <= d.points,
    {
      message: "minPoints cannot exceed base points",
      path: ["minPoints"],
    },
  );

export type UpdateChallengeFormData = z.infer<typeof updateChallengeSchema>;

// Add hint (admin)

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

export type AddHintFormData = z.infer<typeof addHintSchema>;

// Purchase hint (player)

export const purchaseHintSchema = z.object({
  hintIndex: z
    .number({ error: "hintIndex is required" })
    .int("hintIndex must be a whole number")
    .min(0, "hintIndex must be 0 or greater"),
});

export type PurchaseHintFormData = z.infer<typeof purchaseHintSchema>;

// Submit flag

export const submitFlagSchema = z.object({
  flag: z
    .string()
    .min(1, "Flag cannot be empty")
    .max(500, "Flag cannot exceed 500 characters")
    .trim(),
});

export type SubmitFlagFormData = z.infer<typeof submitFlagSchema>;
