import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useAdminChallenges } from "@/modules/challenges/hooks/admin/useAdminChallenges";
import { useDeleteChallenge } from "@/modules/challenges/hooks/admin/useDeleteChallenge";
import { usePublishChallenge } from "@/modules/challenges/hooks/admin/usePublishChallenge";
import { useUnpublishChallenge } from "@/modules/challenges/hooks/admin/useUnpublishChallenge";
import {
  AdminChallenge,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeFilters,
} from "@/modules/challenges/types/challenge.types";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Hash,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Skeleton } from "@/shared/components/Skeleton";
import { fmt } from "@/shared/utils/fmt";
import { timeAgo } from "@/shared/utils/time";
import { RowActions } from "@/modules/challenges/components/admin/RowActions";
import { AnimatePresence } from "motion/react";
import { ChallengeDetailPanel } from "@/modules/challenges/components/admin/ChallengeDetailPanel";
import { motion } from "motion/react";
import {
  DEFAULT_FILTERS,
  FilterBar,
  LocalFilters,
} from "./FilterBar";
import { StatsStrip } from "./StatsStrip";
import { ScoringBadge } from "./badges/ScoringBadge";
import { CatBadge } from "./badges/CatBadge";
import { DiffBadge } from "./badges/DiffBadge";
import { VisibleBadge } from "./badges/VisibleBadge";
import { ChallengeFormPanel } from "./ChallengeFormPanel";
import { ADMIN_CHALLENGE_CAT_ICONS, ADMIN_CHALLENGE_DIFF_CONFIG } from "../../config/admin-challenge-ui.config";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

export default function AdminChallengesPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "superadmin";

  const [filters, setFilters] = useState<LocalFilters>(DEFAULT_FILTERS);
  const [selectedChallenge, setSelectedChallenge] =
    useState<AdminChallenge | null>(null);
  const [formMode, setFormMode] = useState<{
    open: boolean;
    mode: "create" | "edit";
    challenge?: AdminChallenge;
  }>({ open: false, mode: "create" });

  const [deleteTarget, setDeleteTarget] = useState<AdminChallenge | null>(null);
  const [publishTarget, setPublishTarget] = useState<AdminChallenge | null>(
    null,
  );
  const [unpublishTarget, setUnpublishTarget] = useState<AdminChallenge | null>(
    null,
  );

  // Map local filters → API shape
  const apiFilters: ChallengeFilters = {
    search: filters.search || undefined,
    category: (filters.category as ChallengeCategory) || undefined,
    difficulty: (filters.difficulty as ChallengeDifficulty) || undefined,
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data, isLoading, isFetching, refetch } =
    useAdminChallenges(apiFilters);
  const { mutate: deleteChallenge, isPending: isDeleting } =
    useDeleteChallenge();
  const { mutate: publish, isPending: isPublishing } = usePublishChallenge();
  const { mutate: unpublish, isPending: isUnpublishing } =
    useUnpublishChallenge();

  const challenges = data?.challenges ?? [];
  const meta = data?.meta;

  // Filter live/draft in-memory (API doesn't have visibility filter)
  const visible =
    filters.visible === "all"
      ? challenges
      : challenges.filter((c) => String(c.isVisible) === filters.visible);

  const openEdit = useCallback((challenge: AdminChallenge) => {
    setFormMode({ open: true, mode: "edit", challenge });
    setSelectedChallenge(null);
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-800/60 shrink-0">
        <div>
          <span className="font-mono text-xs tracking-[0.25em] text-emerald-400/70 uppercase">
            {"// admin"}
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Challenges
          </h1>
          {meta && (
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {meta.total.toLocaleString()} challenges · page {meta.page} of{" "}
              {meta.totalPages}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            Refresh
          </button>
          <button
            onClick={() => setFormMode({ open: true, mode: "create" })}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New challenge
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className={cn(
            "h-full overflow-y-auto transition-all duration-300",
            selectedChallenge ? "mr-[384px]" : "",
          )}
        >
          <div className="p-6">
            {/* Stats */}
            <StatsStrip />

            {/* Filters */}
            <FilterBar filters={filters} setFilters={setFilters} />

            {/* Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Challenge
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Difficulty
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Points
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Solves
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Published
                      </th>
                      <th className="px-4 py-3 text-right font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading &&
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <Skeleton
                                className="h-4"
                                style={{
                                  width: [140, 80, 70, 50, 40, 70, 70, 40][j],
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}

                    {!isLoading && visible.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Flag className="h-8 w-8 text-slate-700" />
                            <p className="text-sm text-slate-500 font-mono">
                              No challenges found
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {visible.map((challenge) => {
                      const diff =
                        ADMIN_CHALLENGE_DIFF_CONFIG[challenge.difficulty];
                      const CatIcon =
                        ADMIN_CHALLENGE_CAT_ICONS[challenge.category] ?? Hash;
                      const isSelected =
                        selectedChallenge?._id === challenge._id;

                      return (
                        <motion.tr
                          key={challenge._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() =>
                            setSelectedChallenge(isSelected ? null : challenge)
                          }
                          className={cn(
                            "border-b border-slate-800/50 cursor-pointer transition-colors group",
                            isSelected
                              ? "bg-emerald-500/5"
                              : "hover:bg-slate-800/30",
                          )}
                        >
                          {/* Title */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full shrink-0",
                                  diff.bar,
                                )}
                              />
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-medium text-slate-200 truncate max-w-[180px]">
                                  {challenge.title}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <ScoringBadge type={challenge.scoringType} />
                                  {challenge.isHosted && (
                                    <span className="font-mono text-[9px] text-cyan-400">
                                      hosted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            <CatBadge category={challenge.category} />
                          </td>

                          {/* Difficulty */}
                          <td className="px-4 py-3">
                            <DiffBadge difficulty={challenge.difficulty} />
                          </td>

                          {/* Points */}
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                                {fmt(challenge.currentPoints)}
                              </span>
                              {challenge.scoringType === "dynamic" &&
                                challenge.currentPoints !==
                                  challenge.points && (
                                  <span className="font-mono text-[10px] text-slate-600 ml-1">
                                    /{fmt(challenge.points)}
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* Solves */}
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-mono text-sm text-slate-300 tabular-nums">
                                {fmt(challenge.solveCount)}
                              </span>
                              {challenge.totalAttempts > 0 && (
                                <span className="font-mono text-[10px] text-slate-600 ml-1">
                                  /
                                  {Math.round(
                                    (challenge.solveCount /
                                      challenge.totalAttempts) *
                                      100,
                                  )}
                                  %
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <VisibleBadge visible={challenge.isVisible} />
                          </td>

                          {/* Published */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-slate-500">
                              {challenge.publishedAt
                                ? timeAgo(challenge.publishedAt)
                                : "—"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="px-4 py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <RowActions
                              challenge={challenge}
                              isSuperAdmin={isSuperAdmin}
                              onEdit={() => openEdit(challenge)}
                              onPublish={() => setPublishTarget(challenge)}
                              onUnpublish={() => setUnpublishTarget(challenge)}
                              onDelete={() => setDeleteTarget(challenge)}
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="font-mono text-xs text-slate-500">
                  {(meta.page - 1) * meta.limit + 1}–
                  {Math.min(meta.page * meta.limit, meta.total)} of{" "}
                  {meta.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page - 1 }))
                    }
                    disabled={!meta.hasPrev}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from(
                    { length: Math.min(meta.totalPages, 7) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setFilters((p) => ({ ...p, page }))}
                          className={cn(
                            "h-8 min-w-[32px] rounded-lg px-2 font-mono text-xs transition-all",
                            meta.page === page
                              ? "bg-emerald-500 text-slate-950 font-bold"
                              : "border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
                          )}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}
                  {meta.totalPages > 7 && (
                    <span className="font-mono text-xs text-slate-600 px-1">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page + 1 }))
                    }
                    disabled={!meta.hasNext}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedChallenge && (
            <ChallengeDetailPanel
              key={selectedChallenge._id}
              challenge={selectedChallenge}
              onClose={() => setSelectedChallenge(null)}
              onEdit={() => openEdit(selectedChallenge)}
              onDelete={() => setDeleteTarget(selectedChallenge)}
              isSuperAdmin={isSuperAdmin}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {formMode.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setFormMode((p) => ({ ...p, open: false }))}
            />
            <ChallengeFormPanel
              mode={formMode.mode}
              challenge={formMode.challenge}
              onClose={() => setFormMode((p) => ({ ...p, open: false }))}
            />
          </>
        )}
      </AnimatePresence>

      {/* Confirm modals */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteChallenge(deleteTarget._id, {
            onSuccess: () => {
              setDeleteTarget(null);
              if (selectedChallenge?._id === deleteTarget._id)
                setSelectedChallenge(null);
            },
          });
        }}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently removes the challenge, all submissions, and solve history. This cannot be undone."
        confirmLabel="Delete challenge"
        variant="danger"
        isPending={isDeleting}
      />

      <ConfirmModal
        open={!!publishTarget}
        onClose={() => setPublishTarget(null)}
        onConfirm={() => {
          if (!publishTarget) return;
          publish(publishTarget._id, {
            onSuccess: () => setPublishTarget(null),
          });
        }}
        title={`Publish "${publishTarget?.title}"?`}
        description="This will make the challenge visible to all participants immediately."
        confirmLabel="Publish"
        variant="warning"
        isPending={isPublishing}
      />

      <ConfirmModal
        open={!!unpublishTarget}
        onClose={() => setUnpublishTarget(null)}
        onConfirm={() => {
          if (!unpublishTarget) return;
          unpublish(unpublishTarget._id, {
            onSuccess: () => setUnpublishTarget(null),
          });
        }}
        title={`Unpublish "${unpublishTarget?.title}"?`}
        description="This hides the challenge from participants. Existing solves are preserved."
        confirmLabel="Unpublish"
        variant="warning"
        isPending={isUnpublishing}
      />
    </div>
  );
}
