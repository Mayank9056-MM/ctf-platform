import { z } from "zod";
import {
  TEAM_LIMITS,
  TEAM_NAME_REGEX,
  TEAM_SORT_OPTIONS,
  TEAM_SORT_ORDERS,
} from "../constants/team.constants";

// Create team

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(
      TEAM_LIMITS.NAME_MIN,
      `Team name must have at least ${TEAM_LIMITS.NAME_MIN} characters`,
    )
    .max(
      TEAM_LIMITS.NAME_MAX,
      `Team name must be under ${TEAM_LIMITS.NAME_MAX} characters`,
    )
    .trim()
    .regex(
      TEAM_NAME_REGEX,
      "Team name can only contain letters, numbers, spaces, hyphens and underscores",
    ),

  description: z
    .string()
    .max(
      TEAM_LIMITS.DESCRIPTION_MAX,
      `Description must be under ${TEAM_LIMITS.DESCRIPTION_MAX} characters`,
    )
    .trim()
    .optional(),

  isPrivate: z.boolean().default(false),

  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code (e.g. IN, US)")
    .toUpperCase()
    .optional(),
});

export type CreateTeamFormData = z.infer<typeof createTeamSchema>;

// Update team

export const updateTeamSchema = z
  .object({
    name: z
      .string()
      .min(TEAM_LIMITS.NAME_MIN, "Team name must be at least 3 characters")
      .max(TEAM_LIMITS.NAME_MAX, "Team name must be under 50 characters")
      .trim()
      .regex(
        TEAM_NAME_REGEX,
        "Team name can only contain letters, numbers, spaces, hyphens and underscores",
      )
      .optional(),

    description: z
      .string()
      .max(
        TEAM_LIMITS.DESCRIPTION_MAX,
        "Description must be under 500 characters",
      )
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
      .max(
        TEAM_LIMITS.MAX_MEMBERS_CAP,
        `Max members cannot exceed ${TEAM_LIMITS.MAX_MEMBERS_CAP}`,
      )
      .optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateTeamFormData = z.infer<typeof updateTeamSchema>;

// Join by code

export const joinTeamByCodeSchema = z.object({
  code: z.string().min(1, "Join code is required").toUpperCase().trim(),
});

export type JoinTeamByCodeFormData = z.infer<typeof joinTeamByCodeSchema>;

// Invite user

export const inviteUserSchema = z.object({
  username: z
    .string()
    .min(TEAM_LIMITS.USERNAME_MIN, "Username must be at least 3 characters")
    .max(TEAM_LIMITS.USERNAME_MAX, "Username must be under 30 characters")
    .trim(),
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

// Search teams

export const searchTeamSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Search query must be at least 1 character")
    .max(
      TEAM_LIMITS.SEARCH_QUERY_MAX,
      "Search query cannot exceed 50 characters",
    )
    .optional(),

  country: z
    .string()
    .trim()
    .length(2, "Country must be a valid ISO 3166-1 alpha-2 code (e.g. IN, US)")
    .toUpperCase()
    .optional(),

  page: z
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),

  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .optional()
    .default(20),

  sortBy: z
    .enum(TEAM_SORT_OPTIONS, {
      error: () => ({
        message: `sortBy must be one of: ${TEAM_SORT_OPTIONS.join(", ")}`,
      }),
    })
    .optional()
    .default("score"),

  sortOrder: z
    .enum(TEAM_SORT_ORDERS, {
      error: () => ({ message: "sortOrder must be asc or desc" }),
    })
    .optional()
    .default("desc"),
});

export type SearchTeamFormData = z.infer<typeof searchTeamSchema>;
