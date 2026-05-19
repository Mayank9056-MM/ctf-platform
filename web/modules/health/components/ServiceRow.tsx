import { SERVICE_ICONS, SERVICE_LABELS, STATUS_CONFIG } from "../constants/health.constants";
import { motion } from "motion/react";
import {
  ChevronRight,

} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ServiceCheckData,
  ServiceStatus,
  type ValidService,
} from "../types/health-check.types";
import { LatencyBadge } from "./badge/LatencyBadge";
// import { ServiceCheckData } from "../schema/";

export function ServiceRow({
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
