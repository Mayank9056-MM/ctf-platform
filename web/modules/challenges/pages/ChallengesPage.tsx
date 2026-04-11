"use client";

import { useMemo } from "react";
import { useFilters } from "../components/list/useFilters";
import { useChallenges } from "../hooks/useChallenges";
import { useMyStats } from "@/modules/submissions/hooks/useMyStats";
import { useRouter } from "next/navigation";
import { Ambient } from "../components/list/Ambient";
import { PageHeader } from "../components/list/PageHeader";
import { CategoryStrip } from "../components/list/CategoryStrip";
import { StatsStrip } from "../components/list/StatsStrip";
import { FilterToolbar } from "../components/list/FilterToolbar";
import { GridSkeleton } from "../components/list/GridSkeleton";
import { RefreshCw } from "lucide-react";
import { EmptyState } from "../components/list/EmptyState";
import { ChallengeCard } from "../components/list/ChallengeCard";
import { Pagination } from "../components/list/Pagination";

export default function ChallengesPage() {
  const f = useFilters();

  // Build filter object for the hook
  const queryFilters = useMemo(
    () => ({
      ...(f.category && { category: f.category }),
      ...(f.difficulty && { difficulty: f.difficulty }),
      ...(f.search && { search: f.search }),
      sortBy: f.sortBy,
      sortOrder: f.sortOrder,
      page: f.page,
      limit: 50,
    }),
    [f.category, f.difficulty, f.search, f.sortBy, f.sortOrder, f.page],
  );

  const { data, isLoading, isError, refetch } = useChallenges(queryFilters);
  const { data: myStats } = useMyStats();

  const allChallenges = data?.challenges ?? [];
  const meta = data?.meta;

  // Solved IDs for category strip stats
  const solvedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of allChallenges) {
      if (c.solvedAt) ids.add(c._id);
    }
    return ids;
  }, [allChallenges]);

  // Filter by solved state (client-side — server doesn't support this filter)
  const displayedChallenges = useMemo(() => {
    if (f.solved === "solved") return allChallenges.filter((c) => !!c.solvedAt);
    if (f.solved === "unsolved")
      return allChallenges.filter((c) => !c.solvedAt);
    return allChallenges;
  }, [allChallenges, f.solved]);

  const totalSolved = myStats?.challengesSolved ?? 0;
  const totalVisible = meta?.total ?? 0;

  //   const resetFilters = () => {
  //     const router = useRouter();
  //     // Explicit reset to bare URL
  //     window.location.href = "/challenges";
  //   };

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader total={totalVisible} solved={totalSolved} />

          {/* Category strip */}
          <CategoryStrip
            active={f.category}
            onChange={(c) => f.set({ category: c })}
          />

          {/* Per-category stats */}
          {allChallenges.length > 0 && (
            <StatsStrip challenges={allChallenges} solvedIds={solvedIds} />
          )}

          {/* Filter toolbar */}
          <FilterToolbar />

          {/* Grid */}
          {isLoading ? (
            <GridSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="font-mono text-sm text-red-400/70">
                Failed to load challenges
              </p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : displayedChallenges.length === 0 ? (
            <EmptyState
              onReset={() => (window.location.href = "/challenges")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayedChallenges.map((c, i) => (
                <ChallengeCard key={c._id} challenge={c} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && !isLoading && (
            <Pagination
              meta={meta}
              page={f.page}
              onPage={(p) => f.set({ page: String(p) })}
            />
          )}
        </div>
      </div>
    </>
  );
}
