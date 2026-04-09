"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Users,
  Swords,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  BookOpen,
  Activity,
  Crown,
  Globe,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/modules/admin/hooks/dashboard/useAdminDashboard";
import type { PlatformStats } from "@/modules/admin/types/admin.types";
import Link from "next/link";
import { useAuthStore } from "@/modules/auth/store/auth.store";

// Helpers

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pct(a: number, b: number): string {
  if (!b) return "0%";
  return `${Math.round((a / b) * 100)}%`;
}

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Skeleton

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-800/50", className)}
    />
  );
}

// Stat Card

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
function StatCard({
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

// Category Bar

/**
 * A bar component that shows a category's label, count, and solves.
 * The bar's width is proportional to the count relative to the max count.
 * The bar has a subtle animation when it appears.
 *
 * @param {{string}} label - The label of the category.
 * @param {{number}} count - The count of the category.
 * @param {{number}} solves - The number of solves in the category.
 * @param {{number}} max - The maximum count of all categories.
 * @param {{number}} delay - The delay of the animation in milliseconds.
 */
function CategoryBar({
  label,
  count,
  solves,
  max,
  delay,
}: {
  label: string;
  count: number;
  solves: number;
  max: number;
  delay: number;
}) {
  const width = max ? (count / max) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-slate-300 uppercase tracking-wider text-[11px]">
          {label}
        </span>
        <div className="flex gap-3 text-slate-500">
          <span>{count} challs</span>
          <span className="text-emerald-400">{fmt(solves)} solves</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// Audit Log Row

const ACTION_STYLES: Record<string, { color: string; bg: string }> = {
  "user:ban": { color: "text-red-400", bg: "bg-red-500/10" },
  "user:unban": { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "user:delete": { color: "text-red-400", bg: "bg-red-500/10" },
  "user:role_change": { color: "text-amber-400", bg: "bg-amber-500/10" },
  "user:score_update": { color: "text-cyan-400", bg: "bg-cyan-500/10" },
  "user:update_profile": { color: "text-slate-400", bg: "bg-slate-700/40" },
  "admin:bulk_reset_scores": {
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
};

/**
 * A single row in the audit log table.
 *
 * @param log - an audit log entry
 * @param delay - animation delay in seconds
 *
 * @returns a motion.div containing the log entry
 */
function AuditRow({
  log,
  delay,
}: {
  log: {
    _id: string;
    action: string;
    summary?: string;
    outcome: string;
    createdAt: Date | string;
  };
  delay: number;
}) {
  const style = ACTION_STYLES[log.action] ?? {
    color: "text-slate-400",
    bg: "bg-slate-700/40",
  };
  const shortAction =
    log.action.split(":")[1]?.replace(/_/g, " ") ?? log.action;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-start gap-3 py-2.5 border-b border-slate-800/50 last:border-0"
    >
      <div
        className={cn(
          "mt-0.5 rounded px-2 py-0.5 text-[10px] font-mono shrink-0",
          style.bg,
          style.color,
        )}
      >
        {shortAction}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">
          {log.summary ?? log.action}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {log.outcome === "success" ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">
          {timeAgo(log.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

// Top Solver Row

/**
 * A single row in the top solver table.
 *
 * @param {{object}} solver - a top solver entry
 * @param {{number}} rank - the rank of the solver in the table
 * @param {{number}} delay - animation delay in seconds
 *
 * @returns a motion.div containing the solver entry
 */
function SolverRow({
  solver,
  rank,
  delay,
}: {
  solver: {
    _id: string;
    username: string;
    score: number;
    solvedCount: number;
    country?: string;
  };
  rank: number;
  delay: number;
}) {
  const rankColors = ["text-amber-400", "text-slate-300", "text-amber-600"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0"
    >
      <span
        className={cn(
          "font-mono text-sm font-bold w-5 text-right shrink-0",
          rankColors[rank - 1] ?? "text-slate-600",
        )}
      >
        #{rank}
      </span>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <span className="font-mono text-[10px] text-emerald-400">
          {solver.username.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate font-mono">
          {solver.username}
        </p>
        <p className="text-[11px] text-slate-500">
          {solver.solvedCount} solves
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold text-emerald-400">
          {fmt(solver.score)}
        </p>
        {solver.country && (
          <p className="text-[10px] text-slate-600 uppercase">
            {solver.country}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Loading Skeleton

/**
 * A loading skeleton for the admin dashboard page.
 *
 * Contains a mix of different skeleton elements to create a visually appealing loading state.
 *
 * @returns A JSX element containing the skeleton.
 */
function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

// Main Dashboard

/**
 * The admin dashboard page.
 *
 * This page provides an overview of the platform's health,
 * including user and challenge stats, submission accuracy,
 * and recent audit logs.
 *
 * Only accessible by users with the "superadmin" role.
 */
export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminDashboard();

  const categoryMax = useMemo(() => {
    if (!stats) return 1;
    return Math.max(
      ...(stats.challenges.byCategory ?? []).map((c) => c.count),
      1,
    );
  }, [stats]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/30">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-sm text-slate-400">
          Failed to load dashboard stats.
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const s = stats as PlatformStats;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px]">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.25em] text-emerald-400/70 uppercase">
              {"// admin panel"}
            </span>
            {user?.role === "superadmin" && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-400 ring-1 ring-amber-500/20">
                <Crown className="h-2.5 w-2.5" />
                superadmin
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500">
            Real-time stats and platform health.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          Refresh
        </motion.button>
      </div>

      {/* ── User Stats ── */}
      <section className="space-y-3">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase"
        >
          Users
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={s.users.total}
            sub={`${s.users.verified} verified`}
            icon={Users}
            accent="emerald"
            delay={0.05}
            href="/admin/users"
            trend={{ value: `+${s.users.newLast7Days} this week`, up: true }}
          />
          <StatCard
            label="Active Today"
            value={s.users.activeLastDay}
            sub={`${s.users.activeLastWeek} this week`}
            icon={Activity}
            accent="cyan"
            delay={0.1}
          />
          <StatCard
            label="New (30d)"
            value={s.users.newLast30Days}
            sub={`${s.users.newLast7Days} last 7 days`}
            icon={TrendingUp}
            accent="violet"
            delay={0.15}
          />
          <StatCard
            label="Banned"
            value={s.users.banned}
            sub={`${s.users.deleted} deleted`}
            icon={Shield}
            accent="red"
            delay={0.2}
            href="/admin/users?isBanned=true"
          />
        </div>
      </section>

      {/* ── Challenge + Submission Stats ── */}
      <section className="space-y-3">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase"
        >
          Challenges & Submissions
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Challenges"
            value={s.challenges.total}
            sub={`${s.challenges.visible} visible`}
            icon={Swords}
            accent="emerald"
            delay={0.25}
            href="/admin/challenges"
          />
          <StatCard
            label="Solve Rate"
            value={`${s.challenges.solveRate}%`}
            sub={`${fmt(s.challenges.totalSolves)} total solves`}
            icon={Target}
            accent="cyan"
            delay={0.3}
          />
          <StatCard
            label="Submissions Today"
            value={s.submissions.totalToday}
            sub={`${s.submissions.correctToday} correct · ${s.submissions.incorrectToday} wrong`}
            icon={BarChart3}
            accent="amber"
            delay={0.35}
            href="/admin/submissions"
          />
          <StatCard
            label="First Bloods"
            value={s.submissions.firstBloods}
            sub={`${fmt(s.submissions.totalAllTime)} all-time`}
            icon={Zap}
            accent="amber"
            delay={0.4}
          />
        </div>
      </section>

      {/* Teams + Stories */}
      <section className="space-y-3">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase"
        >
          Teams & Stories
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Teams"
            value={s.teams.total}
            sub={`${s.teams.active} active · avg ${s.teams.averageSize} members`}
            icon={Globe}
            accent="cyan"
            delay={0.45}
            href="/admin/teams"
          />
          <StatCard
            label="Stories"
            value={s.stories.total}
            sub={`${s.stories.published} published`}
            icon={BookOpen}
            accent="violet"
            delay={0.5}
            href="/admin/stories"
          />
          <StatCard
            label="Story Players"
            value={s.stories.totalPlayersStat}
            sub={`${s.stories.totalCompletions} completions`}
            icon={Users}
            accent="violet"
            delay={0.55}
          />
          <StatCard
            label="All-Time Solves"
            value={s.submissions.totalAllTime}
            sub="across all challenges"
            icon={Trophy}
            accent="emerald"
            delay={0.6}
          />
        </div>
      </section>

      {/* Bottom grid: Categories + Difficulty + Top Solvers + Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm font-semibold text-white">
              By Category
            </h3>
            <Swords className="h-4 w-4 text-slate-600" />
          </div>
          <div className="space-y-3">
            {(s.challenges.byCategory ?? []).slice(0, 8).map((cat, i) => (
              <CategoryBar
                key={cat._id}
                label={cat._id}
                count={cat.count}
                solves={cat.solves}
                max={categoryMax}
                delay={0.6 + i * 0.04}
              />
            ))}
            {(s.challenges.byCategory ?? []).length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">
                No data yet.
              </p>
            )}
          </div>
        </motion.div>

        {/* Difficulty breakdown + submission accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.35 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm font-semibold text-white">
              Difficulty Breakdown
            </h3>
            <Target className="h-4 w-4 text-slate-600" />
          </div>

          {/* Difficulty rings */}
          <div className="space-y-3">
            {(s.challenges.byDifficulty ?? []).map((d, i) => {
              const DIFF_COLORS: Record<string, string> = {
                easy: "bg-emerald-500",
                medium: "bg-amber-400",
                hard: "bg-red-400",
                insane: "bg-violet-400",
              };
              const total = s.challenges.total || 1;
              return (
                <motion.div
                  key={d._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-slate-300 capitalize text-[11px] tracking-wider">
                      {d._id}
                    </span>
                    <span className="text-slate-500">
                      {d.count} · {pct(d.count, total)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        DIFF_COLORS[d._id.toLowerCase()] ?? "bg-slate-500",
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: pct(d.count, total) }}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.05 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Submission accuracy today */}
          <div className="border-t border-slate-800/60 pt-4 space-y-3">
            <p className="font-mono text-[11px] tracking-[0.15em] text-slate-600 uppercase">
              Today&apos;s Accuracy
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: s.submissions.totalToday
                      ? `${(s.submissions.correctToday / s.submissions.totalToday) * 100}%`
                      : "0%",
                  }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                />
              </div>
              <span className="text-xs font-mono text-emerald-400 shrink-0">
                {s.submissions.totalToday
                  ? `${Math.round((s.submissions.correctToday / s.submissions.totalToday) * 100)}%`
                  : "—"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                <p className="text-[10px] text-slate-600 font-mono uppercase">
                  Correct
                </p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">
                  {s.submissions.correctToday}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                <p className="text-[10px] text-slate-600 font-mono uppercase">
                  Wrong
                </p>
                <p className="text-lg font-bold text-red-400 tabular-nums">
                  {s.submissions.incorrectToday}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Solvers */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.35 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm font-semibold text-white">
              Top Solvers
            </h3>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            {(s.topSolvers ?? []).slice(0, 8).map((solver, i) => (
              <SolverRow
                key={solver._id}
                solver={solver}
                rank={i + 1}
                delay={0.7 + i * 0.04}
              />
            ))}
            {(s.topSolvers ?? []).length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">
                No solvers yet.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Audit Logs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.35 }}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-semibold text-white">
              Recent Activity
            </h3>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          {user?.role === "superadmin" && (
            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors font-mono"
            >
              <Eye className="h-3 w-3" />
              View all
            </Link>
          )}
        </div>
        <div>
          {(s.recentAuditLogs ?? []).map((log, i) => (
            <AuditRow key={log._id} log={log} delay={0.8 + i * 0.03} />
          ))}
          {(s.recentAuditLogs ?? []).length === 0 && (
            <p className="text-xs text-slate-600 text-center py-6">
              No recent activity.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
