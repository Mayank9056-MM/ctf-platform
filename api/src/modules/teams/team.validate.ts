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
  q: z.string().max(50).trim().optional(),

  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),

  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code")
    .toUpperCase()
    .optional(),
});
