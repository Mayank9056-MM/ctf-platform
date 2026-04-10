import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { fmt } from "@/shared/utils/fmt";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: "emerald" | "cyan" | "amber" | "red" | "violet";
  trend?: { value: string; up: boolean };
  delay?: number;
  href?: string;
}

const ACCENT_MAP = {
  emerald: {
    ring: "ring-emerald-500/20",
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  cyan: {
    ring: "ring-cyan-500/20",
    bg: "bg-cyan-500/10",
    icon: "text-cyan-400",
    text: "text-cyan-400",
    bar: "bg-cyan-500",
  },
  amber: {
    ring: "ring-amber-500/20",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    text: "text-amber-400",
    bar: "bg-amber-500",
  },
  red: {
    ring: "ring-red-500/20",
    bg: "bg-red-500/10",
    icon: "text-red-400",
    text: "text-red-400",
    bar: "bg-red-500",
  },
  violet: {
    ring: "ring-violet-500/20",
    bg: "bg-violet-500/10",
    icon: "text-violet-400",
    text: "text-violet-400",
    bar: "bg-violet-500",
  },
};

/**
 * A StatCard component for displaying a statistic.
 *
 * @param {string} label - The label of the statistic.
 * @param {string | number} value - The value of the statistic.
 * @param {string} [sub] - The subtext of the statistic.
 * @param {React.ElementType} icon - The icon of the statistic.
 * @param {"emerald" | "cyan" | "amber" | "red" | "violet"} [accent="emerald"] - The accent color of the statistic.
 * @param {{ value: string, up: boolean }} [trend] - The trend of the statistic.
 * @param {number} [delay=0] - The delay of the animation.
 * @param {string} [href] - The href of the link.
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "emerald",
  trend,
  delay = 0,
  href,
}: StatCardProps) {
  const a = ACCENT_MAP[accent];

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm",
        href && "hover:border-slate-700 transition-colors cursor-pointer",
      )}
    >
      {/* Subtle corner glow */}
      <div
        className={cn(
          "absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-20",
          a.bar,
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <p className="font-mono text-[11px] tracking-[0.2em] text-slate-500 uppercase">
            {label}
          </p>
          <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {typeof value === "number" ? fmt(value) : value}
          </p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.up ? "text-emerald-400" : "text-red-400",
              )}
            >
              {trend.up ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
            a.bg,
            a.ring,
          )}
        >
          <Icon className={cn("h-5 w-5", a.icon)} />
        </div>
      </div>
    </motion.div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
