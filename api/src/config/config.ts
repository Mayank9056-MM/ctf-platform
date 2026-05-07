import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.url().default("http://localhost:5173"),

  FRONTEND_URL: z.url().default("http://localhost:5173"),

  MONGODB_URI: z.url(),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRY: z.string().default("7d"),

  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRY: z.string().default("30d"),

  REDIS_URL: z.url().default("redis://localhost:6379"),

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

  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_REDIRECT_URI: z.string(),

  // aws s3
  AWS_REGION: z.string().min(5),
  AWS_ACCESS_KEY_ID: z.string().min(16),
  AWS_SECRET_ACCESS_KEY: z.string().min(32),
  AWS_S3_BUCKET_NAME: z.string().min(3),
  AWS_S3_ENDPOINT: z.url().optional(),

  // logger
  LOG_STDOUT_ONLY: z.string().default("false"),
  LOG_DIR: z.string().default("./logs"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;
