import { z } from "zod";
import {
  EVENT_FORMATS,
  EVENT_STATUSES,
  EVENT_VISIBILITIES,
} from "../../utils/constants";

// Shared

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const isoDate = (label: string) =>
  z.iso
    .datetime({ message: `${label} must be a valid ISO 8601 datetime` })
    .transform((v) => new Date(v));

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour e.g. #ff4500")
  .optional();

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
    .pipe(z.number().int().min(1).max(100, "Limit cannot exceed 100")),
};

// Scoring Sub-schema

const scoringSchema = z.object({
  dynamicScoring: z.boolean().optional(),

  firstBloodBonus: z
    .number()
    .int("First blood bonus must be a whole number")
    .min(0, "First blood bonus cannot be negative")
    .optional(),

  incorrectPenalty: z
    .number()
    .int("Incorrect penalty must be a whole number")
    .min(0, "Penalty cannot be negative")
    .optional(),

  maxAttemptsPerChallenge: z
    .number()
    .int("Max attempts must be a whole number")
    .min(0, "Max attempts cannot be negative (0 = unlimited)")
    .optional(),
});

// Registration Sub-schema

const registrationSchema = z.object({
  isOpen: z.boolean().optional(),

  maxParticipants: z
    .number()
    .int()
    .min(0, "maxParticipants cannot be negative (0 = unlimited)")
    .optional(),

  maxTeamSize: z
    .number()
    .int()
    .min(1, "maxTeamSize must be at least 1")
    .max(10, "maxTeamSize cannot exceed 10")
    .optional(),

  allowSolo: z.boolean().optional(),

  inviteCode: z
    .string()
    .min(4, "Invite code must be at least 4 characters")
    .max(64, "Invite code must be under 64 characters")
    .trim()
    .optional(),

  allowedUsers: z.array(mongoId).optional(),

  allowedTeams: z.array(mongoId).optional(),

  registrationClosesAt: isoDate("registrationClosesAt").optional(),
});

// Branding Sub-schema

const brandingSchema = z.object({
  tagline: z
    .string()
    .max(160, "Tagline cannot exceed 160 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .max(10000, "Description cannot exceed 10,000 characters")
    .trim()
    .optional(),

  bannerUrl: z.url("bannerUrl must be a valid URL").optional(),
  logoUrl: z.url("logoUrl must be a valid URL").optional(),
  accentColor: hexColor,
  websiteUrl: z.url("websiteUrl must be a valid URL").max(500).optional(),
});

// Create Event

export const createEventSchema = z
  .object({
    name: z
      .string()
      .min(3, "Event name must be at least 3 characters")
      .max(100, "Event name cannot exceed 100 characters")
      .trim(),

    format: z.enum(EVENT_FORMATS, {
      error: () => ({
        message: `Format must be one of: ${EVENT_FORMATS.join(", ")}`,
      }),
    }),

    visibility: z
      .enum(EVENT_VISIBILITIES, {
        error: () => ({
          message: `Visibility must be one of: ${EVENT_VISIBILITIES.join(", ")}`,
        }),
      })
      .optional()
      .default("public"),

    opensAt: isoDate("opensAt"),
    closedAt: isoDate("closedAt"),

    organizerIds: z
      .array(mongoId)
      .min(1, "At least one organizer is required")
      .optional(),

    challengeIds: z.array(mongoId).optional(),

    autoTransition: z.boolean().optional().default(true),

    scoring: scoringSchema.optional(),
    registration: registrationSchema.optional(),
    branding: brandingSchema.optional(),
  })
  .refine((d) => d.closedAt > d.opensAt, {
    message: "closedAt must be after opensAt",
    path: ["closedAt"],
  })
  .refine((d) => d.opensAt > new Date(), {
    message: "opensAt must be in the future",
    path: ["opensAt"],
  })
  .refine((d) => d.visibility !== "invite" || !!d.registration?.inviteCode, {
    message: "An inviteCode is required when visibility is 'invite'",
    path: ["registration", "inviteCode"],
  })
  .refine(
    (d) =>
      d.visibility !== "internal" ||
      (d.registration?.allowedUsers?.length ?? 0) > 0 ||
      (d.registration?.allowedTeams?.length ?? 0) > 0,
    {
      message:
        "At least one allowedUser or allowedTeam is required when visibility is 'internal'",
      path: ["registration", "allowedUsers"],
    }
  )
  .refine(
    (d) =>
      !d.registration?.registrationClosesAt ||
      d.registration.registrationClosesAt <= d.closedAt,
    {
      message: "registrationClosesAt cannot be after the event closedAt",
      path: ["registration", "registrationClosesAt"],
    }
  );

// Update Event

export const updateEventSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),

    format: z.enum(EVENT_FORMATS).optional(),

    visibility: z.enum(EVENT_VISIBILITIES).optional(),

    opensAt: isoDate("opensAt").optional(),
    closedAt: isoDate("closedAt").optional(),

    organizerIds: z.array(mongoId).min(1).optional(),
    challengeIds: z.array(mongoId).optional(),
    autoTransition: z.boolean().optional(),

    scoring: scoringSchema.optional(),
    registration: registrationSchema.optional(),
    branding: brandingSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (d) => {
      if (d.opensAt && d.closedAt) return d.closedAt > d.opensAt;
      return true;
    },
    { message: "closedAt must be after opensAt", path: ["closedAt"] }
  );

// Transition

export const transitionEventSchema = z.object({
  status: z.enum(EVENT_STATUSES, {
    error: () => ({
      message: `Status must be one of: ${EVENT_STATUSES.join(", ")}`,
    }),
  }),
});

// Scoreboard Freeze

export const freezeScoreboardSchema = z.object({
  frozen: z.boolean({ error: "'frozen' (boolean) is required" }),
});

// Add/Remove Challenges

export const manageChallengesSchema = z.object({
  challengeIds: z.array(mongoId).min(1, "At least one challengeId is required"),
});

// Register for Event

export const registerForEventSchema = z.object({
  inviteCode: z
    .string()
    .min(1, "Invite code cannot be empty")
    .trim()
    .optional(),
});

// Event Filters (Player)

export const eventFiltersSchema = z.object({
  ...paginationBase,

  status: z.enum(EVENT_STATUSES).optional(),

  format: z.enum(EVENT_FORMATS).optional(),

  visibility: z.enum(EVENT_VISIBILITIES).optional(),

  search: z
    .string()
    .max(100, "Search must be under 100 characters")
    .trim()
    .optional(),

  sortBy: z
    .enum(["opensAt", "createdAt", "name", "registeredCount"])
    .optional()
    .default("opensAt"),

  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Admin Event Filters

export const adminEventFiltersSchema = eventFiltersSchema.extend({
  organizerId: mongoId.optional(),

  autoTransition: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),
});

// Leaderboard Filters

export const leaderboardFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .pipe(z.number().int().min(1).max(200)),

  type: z.enum(["user", "team"]).optional().default("user"),
});
