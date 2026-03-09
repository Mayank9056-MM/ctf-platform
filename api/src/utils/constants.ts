import { ChallengeDifficulty } from "../models/challenge.model";

export const DB_NAME = "ctf_platform";

export const RETRY_INTERVAL = 5000;
export const MAX_RETRIES = 5;

export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
  ],
};

// Challenge constants

export const CHALLENGE_CACHE_TTL = 30_000; // 30s in-memory cache
export const MAX_FLAG_ATTEMPTS_PER_WINDOW = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 min
export const FLAG_SHARE_ALERT_THRESHOLD = 5; // unique IP's before loggin alert

export const DIFFICULTY_SORT_ORDER: Record<ChallengeDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  insane: 4,
};
