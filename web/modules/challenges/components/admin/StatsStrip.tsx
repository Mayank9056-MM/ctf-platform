import { Eye, Flag, Layers, Tag } from "lucide-react";
import { fmt } from "@/shared/utils/fmt";
import { Skeleton } from "@/shared/components/Skeleton";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useAdminChallengeStats } from "@/modules/challenges/hooks/admin/useAdminChallengesStats";

export function StatsStrip() {
  const { data: stats, isLoading } = useAdminChallengeStats();

  const items = stats
    ? [
        {
          label: "Total",
          value: fmt(stats.totals.total),
          icon: Layers,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          ring: "ring-emerald-500/20",
        },
        {
          label: "Live",
          value: fmt(stats.totals.visible),
          icon: Eye,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
          ring: "ring-cyan-500/20",
        },
        {
          label: "Total Solves",
          value: fmt(stats.totals.totalSolves),
          icon: Flag,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          ring: "ring-amber-500/20",
        },
        {
          label: "Categories",
          value: String(stats.byCategory.length),
          icon: Tag,
          color: "text-violet-400",
          bg: "bg-violet-500/10",
          ring: "ring-violet-500/20",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
              item.bg,
              item.ring,
            )}
          >
            <item.icon className={cn("h-4 w-4", item.color)} />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-white tabular-nums">
              {item.value}
            </p>
            <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
              {item.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
