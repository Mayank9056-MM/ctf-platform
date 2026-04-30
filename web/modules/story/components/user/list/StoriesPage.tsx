"use client";

import { useStories } from "@/modules/story/hooks/useStories";
import { StoryDifficulty } from "@/modules/story/types/story.types";
import { useEffect, useRef, useState } from "react";
import { Ambient } from "./Ambient";
import { HeaderStats } from "./HeaderStats";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  DIFF_FILTERS,
  STATUS_FILTERS,
} from "@/modules/story/config/user-list-ui.config";
import { cn } from "@/lib/utils";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyState } from "./EmptyState";
import { StoryCard } from "./StoryCard";

export default function StoriesPage() {
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<StoryDifficulty | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filters = {
    page,
    limit: 12,
    search: search || undefined,
    difficulty: diffFilter !== "all" ? diffFilter : undefined,
    status: "published" as const,
  };

  const { data, isLoading } = useStories(filters);

  const stories = data?.stories ?? [];
  const pagination = data?.pagination;

  const completedCount = stories.filter(
    (s) => s.userStatus === "completed",
  ).length;
  const inProgressCount = stories.filter(
    (s) => s.userStatus === "in_progress",
  ).length;

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, diffFilter, statusFilter]);

  const filteredStories = stories.filter((s) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "not_started")
      return !s.userStatus || s.userStatus === "not_started";
    return s.userStatus === statusFilter;
  });

  return (
    <>
      <Ambient />

      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* Breadcrumb-style eyebrow */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px w-6 bg-violet-500/60" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-500/80">
                Story Mode
              </span>
            </div>

            <h1 className="font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
              The{" "}
              <span
                className="relative"
                style={{
                  WebkitTextStroke: "1px rgba(139,92,246,0.6)",
                  color: "transparent",
                  textShadow: "0 0 40px rgba(139,92,246,0.4)",
                }}
              >
                Archives
              </span>
            </h1>
            <p className="mt-2 font-mono text-sm text-slate-600">
              Narrative-driven challenges. Complete stories to unlock lore and
              earn XP.
            </p>
          </div>

          <HeaderStats
            total={pagination?.total ?? 0}
            completed={completedCount}
            inProgress={inProgressCount}
          />
        </div>

        {/* ── Search + filter bar ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stories…"
              className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-4 font-mono text-sm text-slate-300 placeholder:text-slate-700 outline-none transition-all focus:border-violet-500/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-violet-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle — mobile */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-xs transition-all sm:hidden",
              showFilters
                ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                : "border-white/[0.06] bg-white/[0.03] text-slate-500",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>

          {/* Diff filter pills — desktop */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {DIFF_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setDiffFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-[10px] font-medium transition-all duration-150",
                  diffFilter === f.value
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                    : "text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile filters panel */}
        {showFilters && (
          <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:hidden">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
              Difficulty
            </p>
            <div className="flex flex-wrap gap-2">
              {DIFF_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setDiffFilter(f.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-mono text-[10px] font-medium transition-all",
                    diffFilter === f.value
                      ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                      : "border border-white/[0.06] text-slate-600 hover:text-slate-400",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Status filter tabs ── */}
        <div className="mb-8 flex gap-1 border-b border-white/[0.04] pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "relative px-4 py-2.5 font-mono text-xs transition-all",
                statusFilter === f.value
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-400",
              )}
            >
              {f.label}
              {statusFilter === f.value && (
                <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
              )}
            </button>
          ))}
        </div>

        {/* ── Story grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredStories.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            filteredStories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-xs text-slate-500 transition-all hover:border-white/[0.1] hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            {Array.from(
              { length: Math.min(7, pagination.totalPages) },
              (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-9 w-9 rounded-xl font-mono text-xs transition-all",
                      page === p
                        ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                        : "border border-white/[0.06] text-slate-600 hover:border-white/[0.1] hover:text-slate-400",
                    )}
                  >
                    {p}
                  </button>
                );
              },
            )}

            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={!pagination.hasNext}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-xs text-slate-500 transition-all hover:border-white/[0.1] hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
