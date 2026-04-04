import { z } from "zod";

export const revokeSessionSchema = z.object({
  sessionId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid session ID"),
});
