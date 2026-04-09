import { api } from "@/shared/lib/api";
import type {
  HealthResponse,
  PingResponse,
  SingleServiceResponse,
  ValidService,
} from "../types/health-check.types";
import { ApiResponse } from "@/shared/types/api.types";

// Ping

/**
 * GET /api/v1/health/ping
 * Public liveness probe — no auth required.
 */
export async function pingApi(): Promise<PingResponse> {
  const res = await api.get<ApiResponse<PingResponse>>("/api/v1/health/ping");
  return res.data.data;
}

// Full health report

/**
 * GET /api/v1/health
 * Full health report including all services + system metrics.
 * Requires superadmin role. Backend returns:
 *   200 → healthy
 *   207 → degraded
 *   503 → unhealthy
 * All three are valid non-error responses — axios throws on 5xx by default
 * so we use `validateStatus` to accept 207 and 503 without throwing.
 */
export async function getHealthApi(): Promise<HealthResponse> {
  const res = await api.get<ApiResponse<HealthResponse>>("/api/v1/health", {
    validateStatus: (status) => status < 600, // accept 503
  });

  // 401/403 — let them propagate naturally so the hook can handle them
  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: res.status });
  }

  return res.data.data;
}

// Single service drill-down

/**
 * GET /api/v1/health/services/:service
 * Drill-down check for a single named service.
 * Requires superadmin role.
 */
export async function getServiceHealthApi(
  service: ValidService,
): Promise<SingleServiceResponse> {
  const res = await api.get<ApiResponse<SingleServiceResponse>>(
    `/api/v1/health/services/${service}`,
    {
      validateStatus: (status) => status < 600,
    },
  );

  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: res.status });
  }

  return res.data.data;
}
