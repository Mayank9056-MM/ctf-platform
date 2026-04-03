// modules/event/validations/event.schema.ts
import { z } from "zod";
import {
  EVENT_FORMATS,
  EVENT_SORT_OPTIONS,
  EVENT_STATUSES,
  EVENT_VISIBILITIES,
  LEADERBOARD_TYPES,
} from "../constants/event.constants";

// Shared

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour e.g. #ff4500")
  .optional();

const isoDate = (label: string) =>
  z.iso.datetime({ message: `${label} must be a valid ISO 8601 datetime` });

const paginationBase = {
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
};

// Sub-schemas

const scoringSchema = z.object({
  dynamicScoring: z.boolean().optional(),
  firstBloodBonus: z.number().int().min(0).optional(),
  incorrectPenalty: z.number().int().min(0).optional(),
  maxAttemptsPerChallenge: z.number().int().min(0).optional(),
});

const registrationSchema = z.object({
  isOpen: z.boolean().optional(),
  maxParticipants: z.number().int().min(0).optional(),
  maxTeamSize: z.number().int().min(1).max(10).optional(),
  allowSolo: z.boolean().optional(),
  inviteCode: z.string().min(4).max(64).trim().optional(),
  allowedUsers: z.array(mongoId).optional(),
  allowedTeams: z.array(mongoId).optional(),
  registrationClosesAt: isoDate("registrationClosesAt").optional(),
});

const brandingSchema = z.object({
  tagline: z.string().max(160).trim().optional(),
  description: z.string().max(10000).trim().optional(),
  bannerUrl: z.url("bannerUrl must be a valid URL").optional(),
  logoUrl: z.url("logoUrl must be a valid URL").optional(),
  accentColor: hexColor,
  websiteUrl: z.url().max(500).optional(),
});

// Create event

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

    organizerIds: z.array(mongoId).min(1).optional(),
    challengeIds: z.array(mongoId).optional(),
    autoTransition: z.boolean().optional().default(true),

    scoring: scoringSchema.optional(),
    registration: registrationSchema.optional(),
    branding: brandingSchema.optional(),
  })
  .refine((d) => new Date(d.closedAt) > new Date(d.opensAt), {
    message: "closedAt must be after opensAt",
    path: ["closedAt"],
  })
  .refine((d) => new Date(d.opensAt) > new Date(), {
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
    },
  )
  .refine(
    (d) =>
      !d.registration?.registrationClosesAt ||
      new Date(d.registration.registrationClosesAt) <= new Date(d.closedAt),
    {
      message: "registrationClosesAt cannot be after the event closedAt",
      path: ["registration", "registrationClosesAt"],
    },
  );

export type CreateEventFormData = z.infer<typeof createEventSchema>;

// Update event

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
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  })
  .refine(
    (d) => {
      if (d.opensAt && d.closedAt)
        return new Date(d.closedAt) > new Date(d.opensAt);
      return true;
    },
    { message: "closedAt must be after opensAt", path: ["closedAt"] },
  );

export type UpdateEventFormData = z.infer<typeof updateEventSchema>;

// Transition

export const transitionEventSchema = z.object({
  status: z.enum(EVENT_STATUSES, {
    error: () => ({
      message: `Status must be one of: ${EVENT_STATUSES.join(", ")}`,
    }),
  }),
});

export type TransitionEventFormData = z.infer<typeof transitionEventSchema>;

// Scoreboard freeze

export const freezeScoreboardSchema = z.object({
  frozen: z.boolean({ message: "'frozen' (boolean) is required" }),
});

export type FreezeScoreboardFormData = z.infer<typeof freezeScoreboardSchema>;

// Manage challenges

export const manageChallengesSchema = z.object({
  challengeIds: z.array(mongoId).min(1, "At least one challengeId is required"),
});

export type ManageChallengesFormData = z.infer<typeof manageChallengesSchema>;

// Register for event

export const registerForEventSchema = z.object({
  inviteCode: z.string().min(1).trim().optional(),
});

export type RegisterForEventFormData = z.infer<typeof registerForEventSchema>;

// Player list filters

export const eventFiltersSchema = z.object({
  ...paginationBase,
  status: z.enum(EVENT_STATUSES).optional(),
  format: z.enum(EVENT_FORMATS).optional(),
  visibility: z.enum(EVENT_VISIBILITIES).optional(),
  search: z.string().max(100).trim().optional(),
  sortBy: z.enum(EVENT_SORT_OPTIONS).optional().default("opensAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type EventFiltersFormData = z.infer<typeof eventFiltersSchema>;

// Admin list filters

export const adminEventFiltersSchema = eventFiltersSchema.extend({
  organizerId: mongoId.optional(),
  autoTransition: z.boolean().optional(),
});

export type AdminEventFiltersFormData = z.infer<typeof adminEventFiltersSchema>;

// Leaderboard filters

export const leaderboardFiltersSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(200).optional().default(50),
  type: z.enum(LEADERBOARD_TYPES).optional().default("user"),
});

export type LeaderboardFiltersFormData = z.infer<
  typeof leaderboardFiltersSchema
>;
