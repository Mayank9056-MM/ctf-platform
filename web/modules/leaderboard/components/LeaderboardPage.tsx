"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/modules/leaderboard/types/leaderboard.types";
import { useUser } from "@/modules/auth/store/auth.store";
import {
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  RefreshCw,
  Snowflake,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useMyRank } from "../api/useMyRank";
import {
  useLeaderboardStore,
} from "../store/leaderboard.store";
import { useLeaderboard } from "../hooks/useLeaderboard";

// Ambient

function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.01]"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(#f59e0b22 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="pointer-events-none fixed left-0 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/4 blur-[130px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/4 blur-[100px]"
        aria-hidden
      />
    </>
  );
}

// Rank medal

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/10 ring-1 ring-yellow-500/30">
        <Crown className="h-4 w-4 text-yellow-400" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-400/10 ring-1 ring-slate-400/20">
        <Medal className="h-4 w-4 text-slate-300" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700/10 ring-1 ring-amber-700/20">
        <Medal className="h-4 w-4 text-amber-600" />
      </div>
    );
  return (
    <div className="flex h-8 w-8 items-center justify-center">
      <span className="font-mono text-sm font-bold tabular-nums text-slate-600">
        {rank > 999 ? "999+" : rank}
      </span>
    </div>
  );
}

// Score bar

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.max(4, (score / max) * 100) : 4;
  return (
    <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/40 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Leaderboard row

function LBRow({
  entry,
  index,
  topScore,
  isCurrentUser,
}: {
  entry: LeaderboardEntry & { isCurrentUser?: boolean };
  index: number;
  topScore: number;
  isCurrentUser?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isTop3 = entry.rank <= 3;

  return (
    <div
      ref={rowRef}
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200",
        "animate-in fade-in slide-in-from-bottom-1",
        isCurrentUser
          ? "bg-amber-950/25 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
          : isTop3
            ? "bg-white/[0.025] hover:bg-white/[0.04]"
            : "hover:bg-white/[0.03]",
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: "both" }}
    >
      {/* Rank */}
      <div className="shrink-0">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div
        className={cn(
          "relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1",
          isCurrentUser ? "ring-amber-500/30" : "ring-white/[0.08]",
        )}
      >
        {entry.avatar?.url ? (
          <Image
            src={entry.avatar.url}
            alt={entry.username}
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.06]">
            <span className="font-mono text-[10px] font-bold text-slate-400">
              {entry.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/${entry.entityType === "team" ? "teams" : "profile"}/${entry.entityType === "team" ? entry.entityId : entry.username}`}
            className={cn(
              "truncate font-mono text-sm font-semibold transition-colors",
              isCurrentUser
                ? "text-amber-300 hover:text-amber-200"
                : "text-slate-200 group-hover:text-white",
            )}
          >
            {entry.username}
          </Link>
          {isCurrentUser && (
            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-400 ring-1 ring-amber-500/20">
              you
            </span>
          )}
          {entry.teamName && entry.entityType === "user" && (
            <span className="truncate font-mono text-[10px] text-slate-700">
              [{entry.teamName}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <ScoreBar score={entry.score} max={topScore} />
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <p className="font-mono text-base font-bold tabular-nums text-white">
          {entry.score.toLocaleString()}
        </p>
        <div className="flex items-center justify-end gap-2 mt-0.5">
          {entry.firstBloods > 0 && (
            <span className="flex items-center gap-0.5 font-mono text-[9px] text-red-400">
              <Zap className="h-2.5 w-2.5" />
              {entry.firstBloods}
            </span>
          )}
          <span className="font-mono text-[10px] text-slate-700">
            {entry.solveCount} solves
          </span>
        </div>
      </div>
    </div>
  );
}

// My rank card

function MyRankCard() {
  const { data: myRank, isLoading } = useMyRank();

  if (isLoading)
    return <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />;
  if (!myRank || myRank.rank === null) return null;

  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 px-5 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: "200ms", animationFillMode: "both" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25">
        <Award className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-amber-400/70 uppercase tracking-widest">
          Your Rank
        </p>
        <p className="font-mono text-2xl font-bold text-white tabular-nums">
          #{myRank.rank.toLocaleString()}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-lg font-bold text-white tabular-nums">
          {myRank.score.toLocaleString()}
        </p>
        <p className="font-mono text-[10px] text-slate-600">
          {myRank.solveCount} solves
        </p>
      </div>
    </div>
  );
}

// Scope selector

const SCOPE_LABELS: Record<string, { label: string; icon: React.ElementType }> =
  {
    global_user: { label: "Players", icon: Trophy },
    global_team: { label: "Teams", icon: Users },
    event_user: { label: "Event (User)", icon: Activity },
    event_team: { label: "Event (Team)", icon: Activity },
  };

function ScopeSelector() {
  const { scope, setScope } = useLeaderboardStore();

  // Only show global scopes on the public leaderboard page
  const scopes = ["global_user", "global_team"] as const;

  return (
    <div className="flex gap-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-1">
      {scopes.map((s) => {
        const { label, icon: Icon } = SCOPE_LABELS[s];
        return (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-xs font-medium transition-all duration-150",
              scope === s
                ? "bg-white/[0.07] text-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-400",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Frozen banner

function FrozenBanner({ frozenAt }: { frozenAt?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-950/15 px-4 py-2.5">
      <Snowflake
        className="h-4 w-4 shrink-0 text-blue-400 animate-spin"
        style={{ animationDuration: "4s" }}
      />
      <p className="font-mono text-xs text-blue-300">
        Scoreboard frozen
        {frozenAt
          ? ` · Scores as of ${formatDistanceToNow(new Date(frozenAt), { addSuffix: true })}`
          : ""}
      </p>
    </div>
  );
}

// Stale banner

function StaleBanner({
  ageSeconds,
  onRefresh,
}: {
  ageSeconds: number;
  onRefresh: () => void;
}) {
  if (ageSeconds < 120) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/15 bg-amber-950/10 px-4 py-2.5">
      <Activity className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
      <p className="flex-1 font-mono text-xs text-amber-300/70">
        Scores updating… ({Math.floor(ageSeconds / 60)}m ago)
      </p>
      <button
        onClick={onRefresh}
        className="font-mono text-[10px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
      >
        <RefreshCw className="h-3 w-3" /> Refresh
      </button>
    </div>
  );
}

// Empty state

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
        <Trophy className="h-8 w-8 text-slate-700" />
      </div>
      <p className="font-mono text-sm font-medium text-slate-500">
        No entries yet
      </p>
      <p className="mt-1 text-xs text-slate-700">
        Solve challenges to appear on the board
      </p>
    </div>
  );
}

// Pagination

function Pagination({
  meta,
  page,
  setPage,
}: {
  meta: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  page: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <button
        onClick={() => setPage(page - 1)}
        disabled={!meta.hasPrev}
        className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Previous
      </button>
      <span className="font-mono text-xs text-slate-700">
        Page {meta.page} of {meta.totalPages}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!meta.hasNext}
        className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Main page

export default function LeaderboardPage() {
  const scope = useLeaderboardStore((s) => s.scope);
  const eventId = useLeaderboardStore((s) => s.eventId);
  const page = useLeaderboardStore((s) => s.page);
  const limit = useLeaderboardStore((s) => s.limit);
  const setPage = useLeaderboardStore((s) => s.setPage);

  const {
    entries,
    meta,
    isFrozen,
    frozenAt,
    isStale,
    ageSeconds,
    isLoading,
    isError,
    refetch,
  } = useLeaderboard({
    scope,
    eventId,
    page,
    limit,
  });

  const topScore = entries[0]?.score ?? 1;
  const user = useUser();

  return (
    <>
      <Ambient />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60">
                  {"// Hall of Fame"}
                </p>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
                  Leaderboard
                </h1>
              </div>
            </div>
            <p className="ml-[52px] text-sm text-slate-500">
              The top operators by total score. Updated every 5 minutes.
            </p>
          </div>

          {/* My rank */}
          <MyRankCard />

          {/* Scope + meta bar */}
          <div
            className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <ScopeSelector />

            {isFrozen && <FrozenBanner frozenAt={frozenAt} />}
            <StaleBanner ageSeconds={ageSeconds} onRefresh={() => refetch()} />
          </div>

          {/* Board */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-3 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="h-8 w-8 animate-pulse rounded-xl bg-white/[0.05]" />
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.05]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.05]" />
                      <div className="h-0.5 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                    </div>
                    <div className="h-6 w-16 animate-pulse rounded bg-white/[0.05]" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <p className="font-mono text-sm text-red-400/70">
                  Failed to load leaderboard
                </p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : entries.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-1">
                {/* Column headers */}
                <div className="flex items-center gap-4 px-4 pb-1 mb-1 border-b border-white/[0.04]">
                  <div className="w-8" />
                  <div className="w-9" />
                  <p className="flex-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
                    {scope === "global_team" ? "Team" : "Player"}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 text-right">
                    Score
                  </p>
                </div>

                {entries.map((entry, i) => (
                  <LBRow
                    key={entry.entityId}
                    entry={entry}
                    index={i}
                    topScore={topScore}
                    isCurrentUser={entry.isCurrentUser}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && !isLoading && (
            <div className="animate-in fade-in duration-300">
              <Pagination meta={meta} page={page} setPage={setPage} />
            </div>
          )}

          {/* Footer note */}
          {!isLoading && !isError && entries.length > 0 && (
            <p className="text-center font-mono text-[10px] text-slate-800">
              Scores recomputed every 5 min ·{" "}
              {isStale ? "update pending" : "up to date"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
