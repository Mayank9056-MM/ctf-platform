"use client";

import { cn } from "@/lib/utils";
import { useMyStats } from "@/modules/submissions/hooks/useMyStats";
import {
  Award,
  BarChart2,
  Flame,
  RefreshCcw,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

// Sparkline

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const recent = data.slice(-14);

  return (
    <div className="mt-2.5 flex h-6 items-end gap-px">
      {Array.from({ length: 14 }).map((_, i) => {
        const entry = recent[recent.length - 14 + i];
        const pct = entry ? Math.max(8, (entry.count / max) * 100) : 0;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500"
            style={{
              height: `${pct}%`,
              backgroundColor: entry
                ? entry.count >= max * 0.6
                  ? "#34d399"
                  : "#134e2e"
                : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

// SVG Solve-rate ring

function SolveRing({ rate }: { rate: number }) {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(rate, 100) / 100);

  return (
    <div className="mt-2 flex items-center gap-2">
      <svg width="30" height="30" className="-rotate-90">
        <circle cx="15" cy="15" r={r} fill="none" stroke="#1a2e1a" strokeWidth="3" />
        <circle
          cx="15"
          cy="15"
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="font-mono text-[10px] text-slate-500">{rate}% rate</span>
    </div>
  );
}

// Streak dots

function StreakDots({ streak }: { streak: number }) {
  const dots = Math.min(streak, 7);
  return (
    <div className="mt-2 flex items-center gap-0.5">
      {Array.from({ length: dots }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-orange-500"
          style={{ opacity: 0.35 + 0.65 * ((i + 1) / dots) }}
        />
      ))}
      {streak > 7 && (
        <span className="ml-1 font-mono text-[9px] text-orange-400">
          +{streak - 7}
        </span>
      )}
    </div>
  );
}

// Stat card

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  highlight?: boolean;
  extra?: React.ReactNode;
  delay?: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  highlight,
  extra,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
        "border border-white/[0.06] bg-[#0d1117]/80",
        "hover:border-white/[0.1] hover:-translate-y-0.5",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_4px_16px_rgba(0,0,0,0.3)]",
        "animate-in fade-in slide-in-from-bottom-3",
        highlight &&
          "border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/30"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: color }}
      />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600">
            {label}
          </span>
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon className="h-3 w-3" />
          </div>
        </div>

        <span className="font-mono text-2xl font-bold tabular-nums text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>

        {sub && (
          <p className="mt-0.5 text-[11px] text-slate-600">{sub}</p>
        )}

        {extra}
      </div>
    </div>
  );
}

// Skeleton grid

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.05] bg-[#0d1117] p-5 h-[120px]"
        />
      ))}
    </div>
  );
}

// Main

export function StatsWidget() {
  const { data: stats, isLoading, isError, refetch } = useMyStats();

  if (isLoading) return <StatsSkeleton />;

  if (isError || !stats) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-red-500/15 bg-red-950/5 px-5 py-4">
        <p className="text-xs text-red-400/70">Could not load stats</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
        >
          <RefreshCcw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      label: "Score",
      value: stats.totalPointsEarned,
      sub: "Total points",
      icon: Trophy,
      color: "#f59e0b",
    },
    {
      label: "Global Rank",
      value: `#${stats.rank.toLocaleString()}`,
      sub: "Among all players",
      icon: Award,
      color: "#818cf8",
      highlight: stats.rank <= 10,
    },
    {
      label: "Solved",
      value: stats.challengesSolved,
      sub: `${stats.total} attempts`,
      icon: Target,
      color: "#10b981",
      extra: <SolveRing rate={stats.solveRate} />,
    },
    {
      label: "First Bloods",
      value: stats.firstBloods,
      sub: stats.firstBloods === 1 ? "challenge" : "challenges",
      icon: Zap,
      color: "#ef4444",
    },
    {
      label: "Streak",
      value: `${stats.streak}d`,
      sub: stats.streak >= 3 ? "Keep going 🔥" : "Start solving!",
      icon: Flame,
      color: "#f97316",
      highlight: stats.streak >= 7,
      extra: stats.streak > 0 ? <StreakDots streak={stats.streak} /> : undefined,
    },
    {
      label: "Incorrect",
      value: stats.incorrect,
      sub: "Wrong submissions",
      icon: BarChart2,
      color: "#475569",
    },
    {
      label: "Avg Attempts",
      value: stats.averageAttemptsPerSolve,
      sub: "Per correct solve",
      icon: RefreshCcw,
      color: "#06b6d4",
    },
    {
      label: "Activity",
      value: `${stats.recentActivity.length}d`,
      sub: "Active in 30 days",
      icon: TrendingUp,
      color: "#34d399",
      extra: <Sparkline data={stats.recentActivity} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} delay={i * 50} />
      ))}
    </div>
  );
}