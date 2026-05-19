"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REFRESH_INTERVALS,
  useHealthCheckStore,
} from "../store/health-check.store";
import { VALID_SERVICES } from "../types/health-check.types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useHealthCheck } from "../hooks/useHealthCheck";
import { OVERALL_CONFIG } from "../constants/health.constants";
import { ServiceRow } from "./ServiceRow";
import { ServiceDrillDown } from "./ServiceDrillDown";
import { SystemMetricsGrid } from "./SystemMetricsGrid";
import { fmt } from "@/shared/utils/fmt";

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
