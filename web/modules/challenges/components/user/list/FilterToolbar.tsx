import { Search, SlidersHorizontal, X } from "lucide-react";
import { useFilters } from "./useFilters";
import { CHALLENGE_DIFFICULTIES } from "../../../types/challenge.types";
import { DIFF_CONFIG } from "../../../config/challenge-list-ui.config";
import { cn } from "@/lib/utils";

export function FilterToolbar() {
  const f = useFilters();

  return (
    <div
      className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: "120ms", animationFillMode: "both" }}
    >
      {/* Search */}
      <div className="relative min-w-0 flex-1 max-w-xs">
        <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600 pointer-events-none" />
        <input
          value={f.search}
          onChange={(e) => f.set({ search: e.target.value || null })}
          placeholder="Search missions…"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-10 pr-8 py-2.5 font-mono text-xs text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
        />
        {f.search && (
          <button
            onClick={() => f.set({ search: null })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Difficulty */}
      <select
        value={f.difficulty ?? ""}
        onChange={(e) => f.set({ difficulty: e.target.value || null })}
        className="rounded-xl border border-white/[0.07] bg-[#0d1117] px-3 py-2.5 font-mono text-xs text-slate-400 outline-none focus:border-white/[0.1] transition-all cursor-pointer appearance-none"
      >
        <option value="">All difficulty</option>
        {CHALLENGE_DIFFICULTIES.map((d) => (
          <option key={d} value={d}>
            {DIFF_CONFIG[d].label}
          </option>
        ))}
      </select>

      {/* Solved state */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.05] p-0.5">
        {(["all", "unsolved", "solved"] as const).map((id) => (
          <button
            key={id}
            onClick={() => f.set({ solved: id === "all" ? null : id })}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-[10px] font-medium transition-all",
              (f.solved ?? "all") === id
                ? "bg-white/[0.07] text-slate-200"
                : "text-slate-600 hover:text-slate-400",
            )}
          >
            {id === "all" ? "All" : id === "unsolved" ? "Unsolved" : "Solved"}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-700" />
        <select
          value={`${f.sortBy}:${f.sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split(":");
            f.set({ sortBy: by, sortOrder: order });
          }}
          className="rounded-xl border border-white/[0.07] bg-[#0d1117] px-3 py-2.5 font-mono text-xs text-slate-400 outline-none focus:border-white/[0.1] transition-all cursor-pointer appearance-none"
        >
          <option value="points:asc">Points ↑</option>
          <option value="points:desc">Points ↓</option>
          <option value="solveCount:asc">Fewest solves</option>
          <option value="solveCount:desc">Most solves</option>
          <option value="publishedAt:desc">Newest</option>
          <option value="difficulty:asc">Easiest first</option>
        </select>
      </div>
    </div>
  );
}
