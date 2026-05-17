// src/lib/redis.ts

import Redis, { type Redis as RedisClient, type RedisOptions } from "ioredis";
import { config } from "../config/config";
import logger from "./logger";

// Shared connection options

const BASE_OPTIONS: RedisOptions = {
  lazyConnect: true,

  retryStrategy(times: number): number | null {
    if (times > 10) {
      logger.error("[Redis] Max reconnect attempts reached — giving up");
      return null; // stop retrying
    }
    const delay = Math.min(100 * Math.pow(2, times), 10_000);
    logger.warn("[Redis] Reconnecting…", { attempt: times, delay_ms: delay });
    return delay;
  },

  // How long to wait for a command before rejecting the promise.
  commandTimeout: 5_000,

  // How long to wait for a new connection before failing.
  connectTimeout: 10_000,

  // Keep TCP connection alive — prevents firewalls from dropping idle connections.
  keepAlive: 10_000,

  // Print ioredis debug info in development.
  showFriendlyErrorStack: config.NODE_ENV !== "production",
};

// Main client (singleton)
// Used for: caching, rate-limiting, session revocation, leaderboard reads.

let _mainClient: RedisClient | null = null;

function buildClient(): RedisClient {
  const client = new Redis(config.REDIS_URL, BASE_OPTIONS);

  client.on("connect", () => logger.info("[Redis] TCP connection established"));
  client.on("ready", () => logger.info("[Redis] Ready — accepting commands"));
  client.on("reconnecting", () => logger.warn("[Redis] Reconnecting…"));
  client.on("end", () => logger.info("[Redis] Connection closed"));
  client.on("error", (err) =>
    logger.error("[Redis] Connection error", { err })
  );

  return client;
}

/**
 * Connect the main Redis client.
 * Call once during server startup. Throws if the connection fails.
 */
export async function connectRedis(): Promise<void> {
  if (_mainClient) {
    logger.warn(
      "[Redis] connectRedis() called but client already exists — ignoring"
    );
    return;
  }

  _mainClient = buildClient();

  try {
    await _mainClient.connect();
    logger.info("[Redis] Main client connected");
  } catch (err) {
    logger.error("[Redis] Failed to connect — fatal", { err });
    throw err;
  }
}

/**
 * Return the main Redis client. Throws if connectRedis() was never called.
 * Use this in your service layer.
 */
export function getRedis(): RedisClient {
  if (!_mainClient) {
    throw new Error(
      "[Redis] getRedis() called before connectRedis(). " +
        "Ensure connectRedis() is awaited during startup."
    );
  }
  return _mainClient;
}

/**
 * Gracefully close the main client.
 * Call from gracefulShutdown() in server.ts.
 * quit() sends QUIT to Redis and waits for the server's ACK — clean close.
 * If quit() itself hangs (e.g. network is gone), disconnect() forces close.
 */
export async function disconnectRedis(): Promise<void> {
  if (!_mainClient) return;

  try {
    await _mainClient.quit();
    logger.info("[Redis] Main client disconnected (quit)");
  } catch {
    _mainClient.disconnect();
    logger.warn("[Redis] Main client force-disconnected");
  } finally {
    _mainClient = null;
  }
}

// Queue connection factory

export function createQueueConnection(): RedisClient {
  return new Redis(config.REDIS_URL, {
    ...BASE_OPTIONS,
    maxRetriesPerRequest: null,
    // Queue connections are long-lived blocking connections — give them more time.
    commandTimeout: undefined,
  });
}

// Key namespace registry
// All Redis key patterns in one place prevents naming collisions across teams.

export const REDIS_KEYS = {
  // Rate limiting
  flagRateLimit: (userId: string, challengeId: string) =>
    `rl:flag:${userId}:${challengeId}`,
  apiRateLimit: (ip: string, route: string) => `rl:api:${ip}:${route}`,

  // Leaderboard cache
  leaderboard: (scope: string, eventId?: string) =>
    `lb:${scope}${eventId ? `:${eventId}` : ""}`,

  // Auth / session
  revokedFamily: (family: string) => `revoked:family:${family}`,
  refreshBlacklist: (jti: string) => `blacklist:rt:${jti}`,

  // BullMQ job dedup keys
  jobDedup: (jobType: string, id: string) => `dedup:${jobType}:${id}`,
} as const;

// TTL constants

export const TTL = {
  FLAG_RATE_WINDOW: 60, // 60 s  — wrong flag attempts
  LEADERBOARD: 60, // 60 s  — leaderboard snapshot
  SESSION_REVOCATION: 60 * 60 * 24 * 7, // 7 days — revoked families
  ANNOUNCEMENT_CACHE: 60 * 5, // 5 min  — pinned announcements
} as const;

// Rate-limit cache
// Uses INCR + conditional EXPIRE. This is an atomic pattern — do NOT replace
// with GET + SET because that introduces a TOCTOU race condition.

const MAX_WRONG_ATTEMPTS = 5;

export const rateLimitCache = {
  async increment(userId: string, challengeId: string): Promise<number> {
    const redis = getRedis();
    const key = REDIS_KEYS.flagRateLimit(userId, challengeId);
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, TTL.FLAG_RATE_WINDOW);
    return count;
  },

  async count(userId: string, challengeId: string): Promise<number> {
    const val = await getRedis().get(
      REDIS_KEYS.flagRateLimit(userId, challengeId)
    );
    return val ? parseInt(val, 10) : 0;
  },

  async reset(userId: string, challengeId: string): Promise<void> {
    await getRedis().del(REDIS_KEYS.flagRateLimit(userId, challengeId));
  },

  isOverLimit(count: number): boolean {
    return count >= MAX_WRONG_ATTEMPTS;
  },
};

// Leaderboard cache

export const leaderboardCache = {
  async set(scope: string, data: unknown, eventId?: string): Promise<void> {
    await getRedis().setex(
      REDIS_KEYS.leaderboard(scope, eventId),
      TTL.LEADERBOARD,
      JSON.stringify(data)
    );
  },

  async get<T>(scope: string, eventId?: string): Promise<T | null> {
    const raw = await getRedis().get(REDIS_KEYS.leaderboard(scope, eventId));
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async invalidate(scope: string, eventId?: string): Promise<void> {
    await getRedis().del(REDIS_KEYS.leaderboard(scope, eventId));
  },
};

// Session revocation cache

export const revocationCache = {
  async markFamilyRevoked(family: string): Promise<void> {
    await getRedis().setex(
      REDIS_KEYS.revokedFamily(family),
      TTL.SESSION_REVOCATION,
      "1"
    );
  },

  async isFamilyRevoked(family: string): Promise<boolean> {
    const val = await getRedis().get(REDIS_KEYS.revokedFamily(family));
    return val === "1";
  },
};
