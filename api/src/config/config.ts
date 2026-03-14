import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  MONGODB_URI: z.string().url(),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRY: z.string().default("7d"),

  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRY: z.string().default("30d"),

  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  //cloudinary
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  MAX_FILE_SIZE: z.coerce.number().default(10485760),
  UPLOAD_PATH: z.string().default("./uploads"),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW: z.coerce.number().default(15),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),

  // Cloudflare S2
  R2_ACCOUNT_ID: z.string().min(5),
  R2_ACCESS_KEY_ID: z.string().min(10),
  R2_SECRET_ACCESS_KEY: z.string().min(10),
  R2_PUBLIC_DOMAIN: z.url(),
  R2_BUCKET_NAME: z.string().min(3),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;
