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
