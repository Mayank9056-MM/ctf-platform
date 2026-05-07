// src/utils/logger/middleware/requestLogger.middleware.ts

import { Request, Response, NextFunction, RequestHandler } from "express";
import { randomUUID } from "crypto";
import { httpLogger, runWithContext } from "../lib/logger";

// Config

export interface RequestLoggerConfig {
  /**
   * Paths to skip entirely (e.g. health checks, metrics endpoints).
   * Exact prefix match — "/health" will skip "/health" and "/health/live".
   */
  skipPaths?: string[];

  /**
   * Log level for successful requests (2xx/3xx). Default: "info".
   * Set to "debug" in high-traffic services to reduce log volume.
   */
  successLevel?: "info" | "debug";

  /**
   * Whether to log request arrival (before handler runs). Default: false.
   * Useful for debugging long-running requests but adds noise in production.
   */
  logIncoming?: boolean;
}

// Default Trusted Headers

/**
 * Read a real client IP from proxy headers.
 * Only read these if you trust your reverse proxy to set them correctly.
 * If you have no proxy (direct internet exposure), use req.ip directly.
 */
function extractIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    // x-forwarded-for can be "client, proxy1, proxy2" — first is the client
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

// Middleware Factory

export function createRequestLogger(
  cfg: RequestLoggerConfig = {}
): RequestHandler {
  const {
    skipPaths = ["/health", "/healthz", "/metrics", "/favicon.ico"],
    successLevel = "info",
    logIncoming = false,
  } = cfg;

  return function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Skip configured paths
    if (skipPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const requestId = (req.headers["x-request-id"] as string) ?? randomUUID();
    const startAt = process.hrtime.bigint();
    const ip = extractIp(req);

    // Attach request ID to response header
    res.setHeader("X-Request-ID", requestId);

    // Store context for the entire async handler chain
    runWithContext(
      {
        requestId,
        ip,
        // userId is not known yet at this point — the auth middleware
        // will call runWithContext again to add it (contexts are merged)
      },
      () => {
        // Optional: log incoming request
        if (logIncoming) {
          httpLogger.debug("Incoming request", {
            requestId,
            method: req.method,
            path: req.path,
            ip,
            userAgent: req.headers["user-agent"],
          });
        }

        // Log on response finish
        res.on("finish", () => {
          const durationNs = process.hrtime.bigint() - startAt;
          const durationMs = Number(durationNs / 1_000_000n);
          const { statusCode } = res;
          const contentLength = res.getHeader("content-length");

          const meta = {
            requestId,
            method: req.method,
            path: req.path,
            statusCode,
            durationMs,
            ip,
            userAgent: req.headers["user-agent"],
            contentLength: contentLength ? Number(contentLength) : undefined,
          };

          if (statusCode >= 500) {
            httpLogger.error("Request failed", meta);
          } else if (statusCode >= 400) {
            httpLogger.warn("Request client error", meta);
          } else {
            httpLogger[successLevel]("Request completed", meta);
          }
        });

        next();
      }
    );
  };
}

/**
 * Ready-to-use default middleware for most Express apps.
 * Attach before your routes:
 *
 *   app.use(requestLoggerMiddleware);
 */
export const requestLoggerMiddleware = createRequestLogger();
