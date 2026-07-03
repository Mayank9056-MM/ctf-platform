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
import { PAGE_SIZES } from "@/modules/admin/constants/admin.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-auto rounded-full px-3 py-1 font-mono text-[11px] transition-all border",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
          : "border-slate-700 bg-transparent text-slate-500 hover:border-slate-500 hover:text-slate-300 hover:bg-transparent",
      )}
    >
      {label}
    </Button>
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
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search challenges..."
            className="w-full rounded-lg border-slate-700 bg-slate-900/60 py-2 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus:border-emerald-500/50 transition-all h-auto"
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
        <Select
          value={filters.category === "" ? "__all__" : filters.category}
          onValueChange={(val) =>
            set({
              category: (val === "__all__" ? "" : val) as
                | ChallengeCategory
                | "",
            })
          }
        >
          <SelectTrigger className="h-auto rounded-lg border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {CHALLENGE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty */}
        <Select
          value={filters.difficulty === "" ? "__all__" : filters.difficulty}
          onValueChange={(val) =>
            set({
              difficulty: (val === "__all__" ? "" : val) as
                | ChallengeDifficulty
                | "",
            })
          }
        >
          <SelectTrigger className="h-auto rounded-lg border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono">
            <SelectValue placeholder="All difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All difficulties</SelectItem>
            {CHALLENGE_DIFFICULTIES.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(val) => {
            const [sortBy, sortOrder] = val.split("-");
            setFilters((p) => ({
              ...p,
              sortBy: sortBy as ChallengeFilters["sortBy"],
              sortOrder: sortOrder as "asc" | "desc",
            }));
          }}
        >
          <SelectTrigger className="h-auto rounded-lg border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publishedAt-desc">Newest</SelectItem>
            <SelectItem value="publishedAt-asc">Oldest</SelectItem>
            <SelectItem value="points-desc">Points ↓</SelectItem>
            <SelectItem value="points-asc">Points ↑</SelectItem>
            <SelectItem value="solveCount-desc">Most solved</SelectItem>
            <SelectItem value="solveCount-asc">Least solved</SelectItem>
          </SelectContent>
        </Select>

        {/* Page size */}
        <Select
          value={String(filters.limit)}
          onValueChange={(val) =>
            setFilters((p) => ({
              ...p,
              limit: Number(val),
              page: 1,
            }))
          }
        >
          <SelectTrigger className="h-auto rounded-lg border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More filters */}
        <Button
          variant="outline"
          onClick={() => setShowMore((v) => !v)}
          className={cn(
            "h-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-mono transition-all",
            showMore
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
              : "border-slate-700 bg-transparent text-slate-500 hover:border-slate-500 hover:text-slate-300 hover:bg-transparent",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </Button>

        {hasActive && (
          <Button
            variant="ghost"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="h-auto p-0 flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-transparent transition-colors font-mono"
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear
          </Button>
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