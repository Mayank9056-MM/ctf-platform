
import {
  Activity,
  Clock,
  Cpu,
  MemoryStick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "../hooks/useHealthCheck";
import { fmtUptime } from "../utils/health.utils";

export function SystemMetricsGrid({
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
