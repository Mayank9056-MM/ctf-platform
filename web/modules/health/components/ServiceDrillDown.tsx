import { motion } from "motion/react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceStatus, type ValidService } from "../types/health-check.types";
import { useServiceHealth } from "../hooks/useServiceHealth";
import { timeAgo } from "@/shared/utils/time";
import { SERVICE_LABELS, STATUS_CONFIG } from "../constants/health.constants";

export function ServiceDrillDown({ service }: { service: ValidService }) {
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
