import { createClient } from "redis";
import { config } from "./config";
import logger from "../lib/logger";

const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => logger.error("Redis Client Error:", { err }));
redisClient.on("connect", () => logger.info("🔗 Redis connecting..."));
redisClient.on("ready", () => logger.info("✅ Redis connected successfully"));
redisClient.on("end", () => logger.info("🔌 Redis disconnected"));

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error("❌ Redis connection failed:", { error });
    process.exit(1);
  }
};

export { redisClient };
