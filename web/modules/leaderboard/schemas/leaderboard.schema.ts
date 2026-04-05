// modules/leaderboard/validations/leaderboard.schema.ts
import { z } from "zod";
import { LEADERBOARD_SCOPES } from "../types/leaderboard.types";

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

// GET /leaderboard query params

export const leaderboardQuerySchema = z
  .object({
    scope: z
      .enum(LEADERBOARD_SCOPES, {
        error: () => ({
          message: `scope must be one of: ${LEADERBOARD_SCOPES.join(", ")}`,
        }),
      })
      .optional()
      .default("global_user"),

    eventId: mongoId.optional(),

    page: z
      .number()
      .int()
      .min(1, "Page must be at least 1")
      .optional()
      .default(1),

    limit: z
      .number()
      .int()
      .min(1)
      .max(200, "Limit cannot exceed 200")
      .optional()
      .default(50),
  })
  .refine(
    (d) => !d.scope.startsWith("event_") || !!d.eventId,
    {
      message: "eventId is required for event-scoped leaderboards",
      path: ["eventId"],
    }
  );

export type LeaderboardQueryFormData = z.infer<typeof leaderboardQuerySchema>;

// Admin recompute params

export const adminRecomputeSchema = z.object({
  scope: z.enum(LEADERBOARD_SCOPES).optional(),
  eventId: mongoId.optional(),
  all: z.boolean().optional().default(false),
});

export type AdminRecomputeFormData = z.infer<typeof adminRecomputeSchema>;