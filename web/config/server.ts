import { z } from "zod";

const serverSchema = z.object({
  API_URL: z.url(),
});

export const serverConfig = serverSchema.parse({
  API_URL: process.env.NEXT_PUBLIC_API_URL,
});
