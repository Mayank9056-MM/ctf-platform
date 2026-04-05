import { z } from "zod";

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid session ID");

// Revoke single session

export const revokeSessionSchema = z.object({
  sessionId: mongoId,
});

export type RevokeSessionFormData = z.infer<typeof revokeSessionSchema>;