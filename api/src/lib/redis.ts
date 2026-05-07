import { createClient, type RedisClientType } from "redis";
import { config } from "../config/config";
import logger from "./logger";

// Singleton

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ url: config.REDIS_URL }) as RedisClientType;

    client.on("error", (err) => logger.error("[Redis] Client error:", err));
    client.on("reconnecting", () => logger.warn("[Redis] Reconnecting…"));

    await client.connect();
    logger.info("[Redis] Connected");
  }

  return client;
}

// Key builders

const KEY = {
  /** Rate-limit counter: wrong flag attempts per user per challenge per window */
  rateLimit: (userId: string, challengeId: string) =>
    `rl:flag:${userId}:${challengeId}`,

  /** Leaderboard snapshot (optional Redis cache on top of MongoDB snapshot) */
  leaderboard: (scope: string, eventId?: string) =>
    `lb:${scope}${eventId ? `:${eventId}` : ""}`,

  /** Session revocation list — used when revokeAllForUser is called */
  revokedFamily: (family: string) => `revoked:family:${family}`,
} as const;

// Rate-limit helpers
// Used in submissionService instead of (or alongside) DB countRecentFailures.
// Redis INCR + EXPIRE is faster than a MongoDB count on large submission tables.

const RATE_WINDOW_SECONDS = 60;
const MAX_WRONG_ATTEMPTS = 5;

export const rateLimitCache = {
  /**
   * Increment the wrong-attempt counter for a user+challenge in the current window.
   * Returns the new count. The key auto-expires after RATE_WINDOW_SECONDS.
   */
  async increment(userId: string, challengeId: string): Promise<number> {
    const redis = await getRedis();
    const key = KEY.rateLimit(userId, challengeId);

    const count = await redis.incr(key);

    // Set expiry only on first increment (otherwise we'd reset the window)
    if (count === 1) {
      await redis.expire(key, RATE_WINDOW_SECONDS);
    }

    return count;
  },

  /** Check current attempt count without incrementing. */
  async count(userId: string, challengeId: string): Promise<number> {
    const redis = await getRedis();
    const val = await redis.get(KEY.rateLimit(userId, challengeId));
    return val ? parseInt(val, 10) : 0;
  },

  /** Manually reset (e.g. after a correct solve). */
  async reset(userId: string, challengeId: string): Promise<void> {
    const redis = await getRedis();
    await redis.del(KEY.rateLimit(userId, challengeId));
  },

  isOverLimit(count: number): boolean {
    return count >= MAX_WRONG_ATTEMPTS;
  },
};

// Leaderboard cache
// Optional layer on top of the MongoDB Leaderboard snapshot.
// Useful if you want sub-millisecond reads for the top-10 board.

const LEADERBOARD_TTL_SECONDS = 60; // 1 min

export const leaderboardCache = {
  async set(scope: string, data: unknown, eventId?: string): Promise<void> {
    const redis = await getRedis();
    await redis.setEx(
      KEY.leaderboard(scope, eventId),
      LEADERBOARD_TTL_SECONDS,
      JSON.stringify(data)
    );
  },

  async get<T>(scope: string, eventId?: string): Promise<T | null> {
    const redis = await getRedis();
    const raw = await redis.get(KEY.leaderboard(scope, eventId));
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async invalidate(scope: string, eventId?: string): Promise<void> {
    const redis = await getRedis();
    await redis.del(KEY.leaderboard(scope, eventId));
  },
};

// Session revocation

const REVOCATION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const revocationCache = {
  async markFamilyRevoked(family: string): Promise<void> {
    const redis = await getRedis();
    await redis.setEx(KEY.revokedFamily(family), REVOCATION_TTL_SECONDS, "1");
  },

  async isFamilyRevoked(family: string): Promise<boolean> {
    const redis = await getRedis();
    const val = await redis.get(KEY.revokedFamily(family));
    return val === "1";
  },
};
