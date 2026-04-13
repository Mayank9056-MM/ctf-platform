"use client";

import { cn } from "@/lib/utils";
import {
  DIFF_CONFIG,
  STATUS_CONFIG,
} from "@/modules/story/config/admin-list-ui.config";
import { useAdminDeleteStory } from "@/modules/story/hooks/admin/useAdminDeleteStory";
import { useAdminSetStoryStatus } from "@/modules/story/hooks/admin/useAdminSetStoryStatus";
import { useAdminStories } from "@/modules/story/hooks/admin/useAdminStories";
import {
  STORY_DIFFICULTIES,
  STORY_STATUSES,
  StoryDifficulty,
  StoryListFilters,
  StoryStatus,
  StorySummary,
} from "@/modules/story/types/story.types";
import { BookOpen, Plus, RefreshCw, Search, X, XCircle } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "./Skeleton";
import { StoryCard } from "./StoryCard";
import { AnimatePresence } from "motion/react";
import { CreateStoryPanel } from "./CreateStoryPanel";
import { motion } from "motion/react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

export default function AdminStoriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoryStatus | "all">("all");
  const [diffFilter, setDiffFilter] = useState<StoryDifficulty | "">("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorySummary | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    story: StorySummary;
    newStatus: StoryStatus;
  } | null>(null);

  const filters: StoryListFilters = {
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    difficulty: diffFilter || undefined,
    page,
    limit: 12,
  };

  const { data, isLoading, isFetching, refetch } = useAdminStories(filters);
  const { mutate: deleteStory, isPending: isDeleting } = useAdminDeleteStory();
  const { mutate: setStatus, isPending: isSettingStatus } =
    useAdminSetStoryStatus(statusTarget?.story._id ?? "");

  const stories = data?.stories ?? data?.items ?? [];
  const meta = data?.meta;

  const hasActiveFilters = !!search || statusFilter !== "all" || !!diffFilter;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ── Cinematic header ── */}
      <div className="relative overflow-hidden border-b border-slate-800/60 px-6 py-5 shrink-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 right-0 h-32 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.25em] text-emerald-400/70 uppercase">
                {"// story engine"}
              </span>
              {isFetching && !isLoading && (
                <RefreshCw className="h-3 w-3 text-slate-600 animate-spin" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Story Arcs
            </h1>
            {meta && (
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {meta.total} stor{meta.total === 1 ? "y" : "ies"} · page{" "}
                {meta.page}/{meta.totalPages}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              />
              Refresh
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Story
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search stories..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 py-2 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Status chips */}
            <div className="flex items-center gap-1">
              {(["all", ...STORY_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-mono text-[11px] border transition-all",
                    statusFilter === s
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                  )}
                >
                  {s === "all" ? "All" : STATUS_CONFIG[s as StoryStatus].label}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <select
              value={diffFilter}
              onChange={(e) => {
                setDiffFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
            >
              <option value="">All difficulties</option>
              {STORY_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFF_CONFIG[d].label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDiffFilter("");
                  setPage(1);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors font-mono"
              >
                <XCircle className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                >
                  <Skeleton className="h-32" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && stories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50">
                  <BookOpen className="h-9 w-9 text-slate-700" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <Plus className="h-2.5 w-2.5 text-slate-500" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono font-semibold text-slate-400">
                  No stories yet
                </p>
                <p className="text-sm text-slate-600">
                  Create your first narrative arc to get started.
                </p>
              </div>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Story
              </button>
            </div>
          )}

          {!isLoading && stories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stories.map((story: StorySummary, i: number) => (
                <motion.div
                  key={story._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <StoryCard
                    story={story}
                    onDelete={() => setDeleteTarget(story)}
                    onSetStatus={(newStatus) =>
                      setStatusTarget({ story, newStatus })
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!meta.hasPrev}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                ← Prev
              </button>
              {Array.from(
                { length: Math.min(meta.totalPages, 7) },
                (_, i) => i + 1,
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-8 w-8 rounded-xl font-mono text-xs transition-all",
                    page === p
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.hasNext}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create panel */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setCreateOpen(false)}
            />
            <CreateStoryPanel onClose={() => setCreateOpen(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteStory(deleteTarget._id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently removes the story, all chapters, nodes, and player progress. This cannot be undone."
        confirmLabel="Delete Story"
        variant="danger"
        isPending={isDeleting}
      />

      {/* Status confirm */}
      <ConfirmModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          statusTarget &&
          setStatus(
            { status: statusTarget.newStatus },
            { onSuccess: () => setStatusTarget(null) },
          )
        }
        title={`${statusTarget?.newStatus === "published" ? "Publish" : statusTarget?.newStatus === "archived" ? "Archive" : "Unpublish"} story?`}
        description={
          statusTarget?.newStatus === "published"
            ? "This makes the story visible to all players immediately."
            : statusTarget?.newStatus === "archived"
              ? "This hides the story from all players. Progress is preserved."
              : "This hides the story from players and returns it to draft."
        }
        confirmLabel="Confirm"
        variant="warning"
        isPending={isSettingStatus}
      />
    </div>
  );
}
