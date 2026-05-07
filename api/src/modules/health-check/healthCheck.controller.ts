import logger from "../../lib/logger";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  healthService,
  VALID_SERVICES,
  ValidService,
} from "./healthCheck.service";
import { OverallStatus, PingResponseSchema } from "./healthCheck.types";

/**
 * Ultra-lightweight liveness probe.
 * No downstream checks — returns 200 as long as the Node process is alive.
 * Safe to expose publicly to load balancers / k8s probes.
 */
export const ping = asyncHandler(async (_req, res) => {
  const body = PingResponseSchema.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });

  return res.status(200).json(new ApiResponse(200, body, "pong"));
});

// GET /health

/**
 * Full health report — all services + system metrics.
 * HTTP status reflects aggregate health:
 *   200 — all healthy
 *   207 — at least one degraded, none unhealthy
 *   503 — at least one unhealthy
 */
export const getHealth = asyncHandler(async (_req, res) => {
  const report = await healthService.runChecks();

  const httpStatus =
    report.status === OverallStatus.HEALTHY
      ? 200
      : report.status === OverallStatus.DEGRADED
        ? 207
        : 503;

  if (report.status !== OverallStatus.HEALTHY) {
    logger.warn(`[Health] Platform status: ${report.status}`, {
      totalDurationMs: report.totalDurationMs,
      services: Object.fromEntries(
        Object.entries(report.services).map(([k, v]) => [k, v.status])
      ),
    });
  }

  return res
    .status(httpStatus)
    .json(new ApiResponse(httpStatus, report, `Platform is ${report.status}`));
});

// GET /health/services/:service

/**
 * Single-service drill-down.
 * :service → mongodb | redisCache | redisSession | storage | email | socket
 * Useful for targeted debugging without running all checks.
 */
export const getServiceHealth = asyncHandler(async (req, res) => {
  const { service } = req.params;

  if (!VALID_SERVICES.includes(service as ValidService)) {
    throw new ApiError(
      400,
      `Unknown service "${service}". Valid options: ${VALID_SERVICES.join(", ")}`
    );
  }

  const result = await healthService.checkSingleService(
    service as ValidService
  );

  const httpStatus =
    result.status === "healthy"
      ? 200
      : result.status === "degraded"
        ? 207
        : 503;

  return res
    .status(httpStatus)
    .json(
      new ApiResponse(httpStatus, result, `${service} is ${result.status}`)
    );
});
