// Enums

export enum ServiceStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

export enum OverallStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

// Service names

export const VALID_SERVICES = [
  "mongodb",
  "redisCache",
  "redisSession",
  "storage",
  "email",
  "socket",
] as const;

export type ValidService = (typeof VALID_SERVICES)[number];

// Service check

export type ServiceCheck = {
  status: ServiceStatus;
  latencyMs: number;
  message: string;
  metadata?: Record<string, unknown>;
  checkedAt: string; // ISO-8601
};

// System metrics

export type MemoryMetrics = {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  usagePercent: number;
  heapUsedMb: number;
  heapTotalMb: number;
  heapUsagePercent: number;
  externalMb: number;
  rssM: number;
};

export type CpuMetrics = {
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
  cores: number;
};

export type SystemMetrics = {
  uptimeSeconds: number;
  nodeVersion: string;
  platform: string;
  arch: string;
  memory: MemoryMetrics;
  cpu: CpuMetrics;
  pid: number;
};

// Services map

export type ServicesMap = {
  mongodb: ServiceCheck;
  redisCache: ServiceCheck;
  redisSession: ServiceCheck;
  storage: ServiceCheck;
  email: ServiceCheck;
  socket: ServiceCheck;
};

// Full health response

export type HealthResponse = {
  status: OverallStatus;
  version: string;
  environment: string;
  timestamp: string;
  totalDurationMs: number;
  services: ServicesMap;
  system: SystemMetrics;
};

// Ping response

export type PingResponse = {
  status: "ok";
  timestamp: string;
  uptime: number;
};

// Single service drill-down response

export type SingleServiceResponse = ServiceCheck & {
  service: ValidService;
};

// Zustand store shape

export type HealthCheckState = {
  /** Which service is selected for the drill-down panel (null = none) */
  selectedService: ValidService | null;
  /** Whether auto-refresh is enabled */
  autoRefresh: boolean;
  /** Interval in ms for auto-refresh */
  refreshIntervalMs: number;
  /** Last time the full health check was fetched (epoch ms, for display) */
  lastFetchedAt: number | null;
};

export type HealthCheckActions = {
  setSelectedService: (service: ValidService | null) => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (ms: number) => void;
  markFetched: () => void;
};

export type HealthCheckStore = HealthCheckState & HealthCheckActions;