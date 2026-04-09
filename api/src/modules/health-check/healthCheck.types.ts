import { z } from "zod";

// Enums

export enum ServiceStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

export enum OverallStatus {
  HEALTHY = "healthy", // all services healthy
  DEGRADED = "degraded", // at least one degraded, none unhealthy
  UNHEALTHY = "unhealthy", // at least one unhealthy
}

// Zod schemas

export const ServiceCheckSchema = z.object({
  status: z.enum(ServiceStatus),
  /** Round-trip latency in milliseconds */
  latencyMs: z.number().nonnegative(),
  message: z.string(),
  /** Optional structured metadata specific to each service */
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** ISO-8601 timestamp of the check */
  checkedAt: z.iso.datetime(),
});

export const SystemMetricsSchema = z.object({
  uptimeSeconds: z.number().nonnegative(),
  nodeVersion: z.string(),
  platform: z.string(),
  arch: z.string(),
  memory: z.object({
    totalMb: z.number(),
    usedMb: z.number(),
    freeMb: z.number(),
    usagePercent: z.number().min(0).max(100),
    heapUsedMb: z.number(),
    heapTotalMb: z.number(),
    heapUsagePercent: z.number().min(0).max(100),
    externalMb: z.number(),
    rssM: z.number(),
  }),
  cpu: z.object({
    loadAvg1m: z.number(),
    loadAvg5m: z.number(),
    loadAvg15m: z.number(),
    cores: z.number().int(),
  }),
  pid: z.number().int(),
});

export const ServicesSchema = z.object({
  mongodb: ServiceCheckSchema,
  redisCache: ServiceCheckSchema, // lib/redis (rate-limit / leaderboard / session)
  redisSession: ServiceCheckSchema, // config/redis (session store)
  storage: ServiceCheckSchema, // S3 / R2
  email: ServiceCheckSchema,
  socket: ServiceCheckSchema,
});

export const HealthResponseSchema = z.object({
  status: z.nativeEnum(OverallStatus),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string().datetime(),
  /** Total time to run all checks in parallel */
  totalDurationMs: z.number().nonnegative(),
  services: ServicesSchema,
  system: SystemMetricsSchema,
});

/** Lightweight ping — no service checks, sub-millisecond */
export const PingResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string().datetime(),
  uptime: z.number(),
});

// TypeScript types

export type ServiceCheck = z.infer<typeof ServiceCheckSchema>;
export type SystemMetrics = z.infer<typeof SystemMetricsSchema>;
export type Services = z.infer<typeof ServicesSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type PingResponse = z.infer<typeof PingResponseSchema>;

// Internal helper types

export type CheckResult = {
  status: ServiceStatus;
  latencyMs: number;
  message: string;
  metadata?: Record<string, unknown>;
};
