import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { getHealth, getServiceHealth, ping } from "./healthCheck.controller";
import {
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";

// Auth guard

const RATE_WINDOW_MS = 10_000; // 10-second window
const MAX_REQUESTS = 10; // max 10 health checks per window per IP

const buckets = new Map<string, { count: number; windowStart: number }>();

function rateLimitHealth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip ?? "unknown";
  const now = Date.now();

  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    res.status(429).json({
      error: "Too Many Requests",
      message: `Health endpoint rate-limited — max ${MAX_REQUESTS} requests per ${RATE_WINDOW_MS / 1000}s`,
      retryAfterMs: RATE_WINDOW_MS - (now - bucket.windowStart),
    });
    return;
  }

  next();
}

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(
  () => {
    const cutoff = Date.now() - RATE_WINDOW_MS;
    for (const [ip, b] of buckets) {
      if (b.windowStart < cutoff) buckets.delete(ip);
    }
  },
  5 * 60 * 1_000
);

// Router

const healthRouter = Router();

/**
 * GET /health/ping
 * Liveness probe — intentionally public (no auth, no rate-limit).
 * Safe to expose to load balancers, k8s probes, and uptime monitors.
 * Returns 200 as long as the Node process is alive.
 */
healthRouter.get("/ping", ping);

/**
 * GET /health
 * Full health report across all services + system metrics.
 * Protected: valid JWT required + caller must hold the "superadmin" role.
 * Rate-limited to prevent hammering downstream services.
 *
 * HTTP status reflects aggregate health:
 *   200 — all services healthy
 *   207 — one or more services degraded
 *   503 — one or more services unhealthy
 */
healthRouter.get(
  "/",
  verifyAuth,
  requireRole("superadmin"),
  rateLimitHealth,
  getHealth
);

/**
 * GET /health/services/:service
 * Drill-down check for a single named service.
 * :service → mongodb | redisCache | redisSession | storage | email | socket
 * Protected: valid JWT + superadmin role required.
 */
healthRouter.get(
  "/services/:service",
  verifyAuth,
  requireRole("superadmin"),
  rateLimitHealth,
  getServiceHealth
);

export default healthRouter;
