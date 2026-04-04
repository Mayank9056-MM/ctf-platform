import { z } from "zod";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const SCOPES = [
  "global_user",
  "global_team",
  "event_user",
  "event_team",
] as const;

export const leaderboardQuerySchema = z
  .object({
    scope: z
      .enum(SCOPES, {
        error: () => ({
          message: `scope must be one of: ${SCOPES.join(", ")}`,
        }),
      })
      .optional()
      .default("global_user"),

    eventId: mongoId.optional(),

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
  })
  .refine((d) => !d.scope.startsWith("event_") || !!d.eventId, {
    message: "eventId is required for event-scoped leaderboards",
    path: ["eventId"],
  });

export const adminRecomputeSchema = z.object({
  scope: z.enum(SCOPES).optional(),
  eventId: mongoId.optional(),
  all: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
