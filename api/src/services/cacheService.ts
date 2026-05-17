// src/services/cacheService.ts

import { redisLogger } from "../lib/logger";
import { getRedis } from "../lib/redis";

// Key Namespace Registry
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
  accessBlacklist: (token: string) => `blacklist:at:${token}`,

  // BullMQ job dedup
  jobDedup: (jobType: string, id: string) => `dedup:${jobType}:${id}`,

  // Announcements
  announcements: (eventId: string) => `announcements:${eventId}`,
} as const;

// TTL Constants

export const TTL = {
  FLAG_RATE_WINDOW: 60, // 60 s  — wrong flag attempt window
  LEADERBOARD: 60, // 60 s  — leaderboard snapshot
  SESSION_REVOCATION: 60 * 60 * 24 * 7, // 7 d   — revoked token families
  ANNOUNCEMENT_CACHE: 60 * 5, // 5 min — pinned announcements
  ACCESS_TOKEN_BLACKLIST: 60 * 15, // 15 min — matches typical AT expiry
} as const;

// CacheService

class CacheService {
  // Primitives

  async get(key: string): Promise<string | null> {
    return getRedis().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      // setex is atomic: sets value AND expiry in one command
      await getRedis().setex(key, ttlSeconds, value);
    } else {
      await getRedis().set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await getRedis().del(key);
  }

  async incr(key: string): Promise<number> {
    return getRedis().incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await getRedis().expire(key, ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    const count = await getRedis().exists(key);
    return count > 0;
  }

  // JSON Helpers

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      redisLogger.warn("Failed to parse cached JSON — treating as cache miss", {
        key,
        err,
      });
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Pattern Invalidation

  async invalidatePattern(pattern: string): Promise<number> {
    const redis = getRedis();
    let cursor = 0;
    let deleted = 0;

    do {
      // ioredis scan() returns [nextCursor, keys]
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );

      cursor = parseInt(nextCursor, 10);

      if (keys.length > 0) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== 0);

    if (deleted > 0) {
      redisLogger.debug("Pattern invalidation complete", { pattern, deleted });
    }

    return deleted;
  }
}

export const cacheService = new CacheService();

// Rate Limit Cache

const MAX_WRONG_ATTEMPTS = 5;

export const rateLimitCache = {
  async increment(userId: string, challengeId: string): Promise<number> {
    const redis = getRedis();
    const key = REDIS_KEYS.flagRateLimit(userId, challengeId);
    const count = await redis.incr(key);
    // Only set expiry on the first increment — resetting on every call lets
    // an attacker extend the window indefinitely by pacing requests.
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

// Leaderboard Cache

export const leaderboardCache = {
  async set(scope: string, data: unknown, eventId?: string): Promise<void> {
    await cacheService.setJSON(
      REDIS_KEYS.leaderboard(scope, eventId),
      data,
      TTL.LEADERBOARD
    );
  },

  async get<T>(scope: string, eventId?: string): Promise<T | null> {
    return cacheService.getJSON<T>(REDIS_KEYS.leaderboard(scope, eventId));
  },

  async invalidate(scope: string, eventId?: string): Promise<void> {
    await getRedis().del(REDIS_KEYS.leaderboard(scope, eventId));
  },
};

// Session Revocation Cache

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

  async blacklistAccessToken(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return; // token already expired — nothing to do
    await getRedis().setex(REDIS_KEYS.accessBlacklist(token), ttlSeconds, "1");
  },

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const val = await getRedis().get(REDIS_KEYS.accessBlacklist(token));
    return val === "1";
  },
};
