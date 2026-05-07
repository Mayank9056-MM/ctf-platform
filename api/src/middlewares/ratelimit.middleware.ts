import rateLimit from "express-rate-limit";
import { RATE_LIMIT } from "../utils/constants";
import { config } from "../config/config";
import logger from "../lib/logger";

export const rateLimiter = rateLimit({
  windowMs:
    config.NODE_ENV === "development" ? 30 * 60 * 1000 : RATE_LIMIT.windowMs,
  max: config.NODE_ENV === "development" ? 1000 : RATE_LIMIT.max,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  handler: (req, res, next, options) => {
    logger.warn("Rate limit exceeded:", {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});
