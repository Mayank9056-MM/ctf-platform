import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must have at least 3 characters")
    .max(50, "Team name must be under 50 characters")
    .trim()
    .regex(
      /^[a-zA-Z0-9 _-]+$/,
      "Team name can contain letters, numbers, spaces hyphens and underscores"
    ),

  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .trim()
    .optional(),

  isPrivate: z.boolean().default(false),

  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code (e.g. IN, US)")
    .toUpperCase()
    .optional(),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must be under 50 characters")
    .trim()
    .regex(
      /^[a-zA-Z0-9 _-]+$/,
      "Team name can only contain letters, numbers, spaces, hyphens and underscores"
    )
    .optional(),

  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .trim()
    .optional(),

  isPrivate: z.boolean().optional(),

  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code")
    .toUpperCase()
    .optional(),

  maxMembers: z
    .number()
    .int()
    .min(1, "Max members must be at least 1")
    .max(10, "Max members cannot exceed 10")
    .optional(),
});

export const joinTeamByCodeSchema = z.object({
  code: z.string().min(1, "Join code is required").toUpperCase().trim(),
});

export const inviteUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .trim(),
});

export const searchTeamSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Search query must be at least 1 character")
    .max(50, "Search query cannot exceed 50 characters")
    .optional(),

  country: z
    .string()
    .trim()
    .length(2, "Country must be a valid ISO 3166-1 alpha-2 code (e.g. IN, US)")
    .toUpperCase()
    .optional(),

  page: z
    .union([z.string(), z.number()])
    .transform(Number)
    .pipe(
      z
        .number()
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
    )
    .optional()
    .default(1),

  limit: z
    .union([z.string(), z.number()])
    .transform(Number)
    .pipe(
      z
        .number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(50, "Limit cannot exceed 50")
    )
    .optional()
    .default(20),

  sortBy: z
    .enum(["score", "memberCount", "createdAt"], {
      error: () => ({
        message: "sortBy must be one of: score, memberCount, createdAt",
      }),
    })
    .optional()
    .default("score"),

  sortOrder: z
    .enum(["asc", "desc"], {
      error: () => ({ message: "sortOrder must be asc or desc" }),
    })
    .optional()
    .default("desc"),
});
