import { z } from "zod";

const serverSchema = z.object({
  API_URL: z.url(),
  NEXT_PUBLIC_SOCKET_URL: z.string().min(1),
});

export const serverConfig = serverSchema.parse({
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
});
