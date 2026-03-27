import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_HOST: z.url(),
});

const env = envSchema.parse(process.env);

export const config = {
  POSTHOG_PROJECT_TOKEN: env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  POSTHOG_HOST: env.NEXT_PUBLIC_POSTHOG_HOST,
};
