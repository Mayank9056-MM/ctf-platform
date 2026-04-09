"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Mail,
  MemoryStick,
  RefreshCw,
  ServerCrash,
  Timer,
  Wifi,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REFRESH_INTERVALS,
  useHealthCheckStore,
} from "../store/health-check.store";
import {
  OverallStatus,
  ServiceStatus,
  VALID_SERVICES,
  type ValidService,
} from "../types/health-check.types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { ServiceCheckData } from "../schema/health-check.shema";
import { useServiceHealth } from "../hooks/useServiceHealth";
import { useHealthCheck } from "../hooks/useHealthCheck";
import { useServiceStatusSummary } from "../hooks/useServiceStatusSummary";

// Constants

const SERVICE_ICONS: Record<ValidService, React.ElementType> = {
  mongodb: Database,
  redisCache: Zap,
  redisSession: HardDrive,
  storage: HardDrive,
  email: Mail,
  socket: Wifi,
};

const SERVICE_LABELS: Record<ValidService, string> = {
  mongodb: "MongoDB",
  redisCache: "Redis Cache",
  redisSession: "Redis Session",
  storage: "S3 Storage",
  email: "SMTP Email",
  socket: "Socket.IO",
};

const STATUS_CONFIG: Record<
  ServiceStatus,
  { color: string; bg: string; ring: string; dot: string; label: string }
> = {
  [ServiceStatus.HEALTHY]: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-400",
    label: "Healthy",
  },
  [ServiceStatus.DEGRADED]: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    dot: "bg-amber-400",
    label: "Degraded",
  },
  [ServiceStatus.UNHEALTHY]: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    dot: "bg-red-400",
    label: "Unhealthy",
  },
};

const OVERALL_CONFIG: Record<
  OverallStatus,
  {
    color: string;
    bg: string;
    border: string;
    label: string;
    Icon: React.ElementType;
  }
> = {
  [OverallStatus.HEALTHY]: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "All Systems Operational",
    Icon: CheckCircle2,
  },
  [OverallStatus.DEGRADED]: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Partial Outage",
    Icon: AlertTriangle,
  },
  [OverallStatus.UNHEALTHY]: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Major Outage",
    Icon: ServerCrash,
  },
};

// Helpers

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

// Latency badge

function LatencyBadge({ ms }: { ms: number }) {
  const color =
    ms < 100
      ? "text-emerald-400"
      : ms < 500
        ? "text-amber-400"
        : "text-red-400";
  return (
    <span className={cn("font-mono text-[11px] tabular-nums", color)}>
      {fmt(ms)}
    </span>
  );
}

// Service row

function ServiceRow({
  name,
  check,
  selected,
  onSelect,
  delay,
}: {
  name: ValidService;
  check: ServiceCheckData;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const Icon = SERVICE_ICONS[name];
  const sc = STATUS_CONFIG[check.status];

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay }}
      onClick={onSelect}
      className={cn(
        "group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
        selected
          ? "bg-slate-800/80 ring-1 ring-slate-700"
          : "hover:bg-slate-800/40",
      )}
    >
      {/* Status dot */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
            sc.bg,
            sc.ring,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", sc.color)} />
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#070d1a]",
            sc.dot,
            check.status === ServiceStatus.UNHEALTHY && "animate-pulse",
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {SERVICE_LABELS[name]}
        </p>
        <p className="text-[11px] text-slate-500 truncate">{check.message}</p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <LatencyBadge ms={check.latencyMs} />
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-slate-600 transition-transform",
            selected && "rotate-90 text-slate-400",
          )}
        />
      </div>
    </motion.button>
  );
}

// Service drill-down

function ServiceDrillDown({ service }: { service: ValidService }) {
  const { data, isLoading, isError, refetch } = useServiceHealth(service);
  const sc = data
    ? STATUS_CONFIG[data.status]
    : STATUS_CONFIG[ServiceStatus.HEALTHY];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mx-3 mb-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Checking {SERVICE_LABELS[service]}...
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            Failed to fetch service status.
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-mono font-medium", sc.color)}>
                {sc.label}
              </span>
              <span className="text-[10px] text-slate-600 font-mono">
                {timeAgo(data.checkedAt)}
              </span>
            </div>

            <p className="text-xs text-slate-400">{data.message}</p>

            {data.metadata && Object.keys(data.metadata).length > 0 && (
              <div className="space-y-1">
                {Object.entries(data.metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-mono">{k}</span>
                    <span className="text-slate-300 font-mono truncate max-w-[120px]">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-emerald-400 transition-colors font-mono"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Re-check
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// System metrics mini-grid

function SystemMetricsGrid({
  system,
}: {
  system: NonNullable<ReturnType<typeof useHealthCheck>["data"]>["system"];
}) {
  const metrics = [
    {
      icon: Clock,
      label: "Uptime",
      value: fmtUptime(system.uptimeSeconds),
      color: "text-emerald-400",
    },
    {
      icon: MemoryStick,
      label: "Heap",
      value: `${system.memory.heapUsedMb}/${system.memory.heapTotalMb} MB`,
      color:
        system.memory.heapUsagePercent > 80
          ? "text-red-400"
          : system.memory.heapUsagePercent > 60
            ? "text-amber-400"
            : "text-slate-300",
    },
    {
      icon: Cpu,
      label: "CPU (1m)",
      value: system.cpu.loadAvg1m.toFixed(2),
      color:
        system.cpu.loadAvg1m > system.cpu.cores * 0.8
          ? "text-red-400"
          : "text-slate-300",
    },
    {
      icon: Activity,
      label: "RSS",
      value: `${system.memory.rssM} MB`,
      color: "text-slate-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2"
        >
          <m.icon className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
              {m.label}
            </p>
            <p className={cn("text-xs font-mono font-semibold", m.color)}>
              {m.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main panel

export function HealthCheckPanel() {
  const user = useAuthStore((s) => s.user);
  const [expanded, setExpanded] = useState(true);

  const selectedService = useHealthCheckStore((s) => s.selectedService);
  const setSelectedService = useHealthCheckStore((s) => s.setSelectedService);
  const autoRefresh = useHealthCheckStore((s) => s.autoRefresh);
  const toggleAutoRefresh = useHealthCheckStore((s) => s.toggleAutoRefresh);
  const refreshIntervalMs = useHealthCheckStore((s) => s.refreshIntervalMs);
  const setRefreshInterval = useHealthCheckStore((s) => s.setRefreshInterval);

  const { data, isLoading, isError, isFetching, refresh } = useHealthCheck();

  // Only superadmin can see this panel
  if (user?.role !== "superadmin") return null;

  const overall = data ? OVERALL_CONFIG[data.status] : null;
  const OIcon = overall?.Icon ?? Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.35 }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Overall status dot */}
            {data && (
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  data.status === "healthy"
                    ? "bg-emerald-400 animate-pulse"
                    : data.status === "degraded"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-red-400 animate-pulse",
                )}
              />
            )}
            <h3 className="font-mono text-sm font-semibold text-white">
              System Health
            </h3>
          </div>

          {data && overall && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ring-1",
                overall.bg,
                overall.border,
                overall.color,
              )}
            >
              <OIcon className="h-2.5 w-2.5" />
              {overall.label}
            </span>
          )}

          {isLoading && (
            <span className="font-mono text-[10px] text-slate-600">
              Checking...
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Refresh interval selector */}
          <select
            value={refreshIntervalMs}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-400 outline-none focus:border-slate-500"
          >
            <option value={REFRESH_INTERVALS.FAST}>10s</option>
            <option value={REFRESH_INTERVALS.NORMAL}>30s</option>
            <option value={REFRESH_INTERVALS.SLOW}>60s</option>
          </select>

          {/* Auto-refresh toggle */}
          <button
            onClick={toggleAutoRefresh}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] transition-all border",
              autoRefresh
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-600",
              )}
            />
            {autoRefresh ? "Live" : "Paused"}
          </button>

          {/* Manual refresh */}
          <button
            onClick={refresh}
            disabled={isFetching}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
          </button>

          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-600 transition-transform duration-200 ml-1",
              !expanded && "-rotate-90",
            )}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 space-y-1 border-t border-slate-800/60 pt-3">
              {/* Error state */}
              {isError && !data && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 mx-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      Health check unavailable
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ensure you have superadmin privileges.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading skeleton */}
              {isLoading &&
                VALID_SERVICES.map((s) => (
                  <div
                    key={s}
                    className="h-12 rounded-lg bg-slate-800/40 animate-pulse mx-0"
                  />
                ))}

              {/* Service rows */}
              {data &&
                VALID_SERVICES.map((name, i) => (
                  <div key={name}>
                    <ServiceRow
                      name={name}
                      check={data.services[name]}
                      selected={selectedService === name}
                      onSelect={() =>
                        setSelectedService(
                          selectedService === name ? null : name,
                        )
                      }
                      delay={i * 0.04}
                    />
                    <AnimatePresence>
                      {selectedService === name && (
                        <ServiceDrillDown
                          key={`drill-${name}`}
                          service={name}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                ))}

              {/* System metrics */}
              {data && (
                <div className="pt-3 px-1 space-y-2">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase px-2">
                    System Metrics
                  </p>
                  <SystemMetricsGrid system={data.system} />

                  {/* Version + env strip */}
                  <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-slate-600">
                    <span>
                      v{data.version} · {data.environment}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-2.5 w-2.5" />
                      {fmt(data.totalDurationMs)} total
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact status strip (for dashboard header)

/**
 * Tiny inline strip showing 6 service dots.
 * Drop this anywhere — it only fetches if user is superadmin.
 */
export function HealthStatusStrip() {
  const user = useAuthStore((s) => s.user);
  const summary = useServiceStatusSummary();

  if (user?.role !== "superadmin" || summary.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5" title="Platform health">
      {summary.map((s) => {
        const sc = STATUS_CONFIG[s.status];
        return (
          <div
            key={s.name}
            title={`${SERVICE_LABELS[s.name]}: ${sc.label} (${fmt(s.latencyMs)})`}
            className={cn(
              "h-2 w-2 rounded-full",
              sc.dot,
              s.status !== ServiceStatus.HEALTHY && "animate-pulse",
            )}
          />
        );
      })}
    </div>
  );
}
