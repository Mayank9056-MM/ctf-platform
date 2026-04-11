import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Filter, Search, X, XCircle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import {
  CHALLENGE_CATEGORIES,
  CHALLENGE_DIFFICULTIES,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeFilters,
} from "@/modules/challenges/types/challenge.types";
import { PAGE_SIZES } from "../../constants/admin.constants";

export type LocalFilters = {
  search: string;
  category: ChallengeCategory | "";
  difficulty: ChallengeDifficulty | "";
  visible: "all" | "true" | "false";
  sortBy: ChallengeFilters["sortBy"];
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
};

export const DEFAULT_FILTERS: LocalFilters = {
  search: "",
  category: "",
  difficulty: "",
  visible: "all",
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
  limit: 20,
};

export function FilterBar({
  filters,
  setFilters,
}: {
  filters: LocalFilters;
  setFilters: React.Dispatch<React.SetStateAction<LocalFilters>>;
}) {
  const [showMore, setShowMore] = useState(false);
  const hasActive =
    !!filters.search ||
    !!filters.category ||
    !!filters.difficulty ||
    filters.visible !== "all";

  const set = (patch: Partial<LocalFilters>) =>
    setFilters((p) => ({ ...p, ...patch, page: 1 }));

  const Chip = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 font-mono text-[11px] transition-all border",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300",
      )}
    >
      {label}
    </button>
  );

  const SortHeader = ({
    field,
    label,
  }: {
    field: ChallengeFilters["sortBy"];
    label: string;
  }) => {
    const active = filters.sortBy === field;
    return (
      <button
        onClick={() =>
          setFilters((p) => ({
            ...p,
            sortBy: field,
            sortOrder: active && p.sortOrder === "desc" ? "asc" : "desc",
          }))
        }
        className={cn(
          "flex items-center gap-1 font-mono text-[11px] tracking-wider uppercase transition-colors",
          active ? "text-emerald-400" : "text-slate-600 hover:text-slate-400",
        )}
      >
        {label}
        {active && (
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              filters.sortOrder === "asc" && "rotate-180",
            )}
          />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3 border-b border-slate-800/60 pb-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search challenges..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => set({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) =>
            set({ category: e.target.value as ChallengeCategory | "" })
          }
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
        >
          <option value="">All categories</option>
          {CHALLENGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty}
          onChange={(e) =>
            set({
              difficulty: e.target.value as ChallengeDifficulty | "",
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
        >
          <option value="">All difficulties</option>
          {CHALLENGE_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split("-");
            setFilters((p) => ({
              ...p,
              sortBy: sortBy as ChallengeFilters["sortBy"],
              sortOrder: sortOrder as "asc" | "desc",
            }));
          }}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
        >
          <option value="publishedAt-desc">Newest</option>
          <option value="publishedAt-asc">Oldest</option>
          <option value="points-desc">Points ↓</option>
          <option value="points-asc">Points ↑</option>
          <option value="solveCount-desc">Most solved</option>
          <option value="solveCount-asc">Least solved</option>
        </select>

        {/* Page size */}
        <select
          value={filters.limit}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              limit: Number(e.target.value),
              page: 1,
            }))
          }
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>

        {/* More filters */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-mono transition-all",
            showMore
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        {hasActive && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors font-mono"
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest self-center mr-1">
                Visibility:
              </span>
              {(
                [
                  ["all", "All"],
                  ["true", "Live only"],
                  ["false", "Drafts only"],
                ] as const
              ).map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  active={filters.visible === val}
                  onClick={() => set({ visible: val })}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
