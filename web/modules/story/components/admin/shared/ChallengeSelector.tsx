"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Search,
  Swords,
  X,
} from "lucide-react";
import {
  useAdminChallengesForSelector,
  type ChallengeSummary,
} from "@/modules/story/hooks/admin/useAdminChallengesForSelector";

// Difficulty config

const DIFF_CFG: Record<string, { color: string }> = {
  easy: { color: "text-emerald-400" },
  medium: { color: "text-amber-400" },
  hard: { color: "text-orange-400" },
  insane: { color: "text-red-400" },
};

const CAT_COLORS: Record<string, string> = {
  web: "#34d399",
  pwn: "#f87171",
  crypto: "#a78bfa",
  forensics: "#60a5fa",
  reversing: "#fb923c",
  misc: "#94a3b8",
  osint: "#f472b6",
  blockchain: "#38bdf8",
  hardware: "#4ade80",
  cloud: "#7dd3fc",
};

// Props

interface ChallengeSelectorProps {
  value?: string; // selected challenge _id
  onChange: (id: string) => void;
  error?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ChallengeSelector({
  value,
  onChange,
  error,
}: ChallengeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    data: challenges,
    isLoading,
    isError,
  } = useAdminChallengesForSelector();

  // Find selected challenge
  const selected = useMemo(
    () => challenges?.find((c) => c._id === value) ?? null,
    [challenges, value],
  );

  // Filter by search
  const filtered = useMemo(() => {
    if (!challenges) return [];
    const q = search.toLowerCase();
    return q
      ? challenges.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            c.difficulty.toLowerCase().includes(q),
        )
      : challenges;
  }, [challenges, search]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, ChallengeSummary[]> = {};
    for (const c of filtered) {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
              "bg-slate-900/60 hover:border-slate-600",
              error ? "border-red-500/60" : "border-slate-700",
              open && "border-violet-500/40 ring-1 ring-violet-500/20",
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Swords
                className={cn(
                  "h-4 w-4 shrink-0",
                  selected ? "text-red-400" : "text-slate-600",
                )}
              />
              {isLoading ? (
                <span className="font-mono text-xs text-slate-600">
                  Loading challenges…
                </span>
              ) : selected ? (
                <div className="min-w-0">
                  <p className="font-mono text-sm text-white truncate">
                    {selected.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="font-mono text-[9px]"
                      style={{
                        color: CAT_COLORS[selected.category] ?? "#64748b",
                      }}
                    >
                      {selected.category}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[9px]",
                        DIFF_CFG[selected.difficulty]?.color,
                      )}
                    >
                      {selected.difficulty}
                    </span>
                    <span className="font-mono text-[9px] text-amber-400">
                      {selected.points} pts
                    </span>
                    <span className="font-mono text-[9px] text-slate-600">
                      {selected.solveCount} solves
                    </span>
                  </div>
                </div>
              ) : (
                <span className="font-mono text-sm text-slate-600">
                  Select a challenge…
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  className="rounded p-0.5 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-600 transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[420px] p-0 bg-[#090e1a] border-slate-800 shadow-2xl"
          align="start"
          sideOffset={4}
        >
          {/* Search */}
          <div className="border-b border-slate-800 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, category, difficulty…"
                className="pl-9 h-8 bg-slate-900/60 border-slate-700 text-white text-xs placeholder:text-slate-700 focus-visible:ring-violet-500/30"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                <span className="font-mono text-xs text-slate-600">
                  Loading…
                </span>
              </div>
            )}

            {isError && (
              <div className="flex items-center gap-2 p-4 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="font-mono text-xs">
                  Failed to load challenges
                </span>
              </div>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <div className="py-8 text-center">
                <p className="font-mono text-xs text-slate-600">
                  {search
                    ? `No challenges matching "${search}"`
                    : "No challenges found"}
                </p>
              </div>
            )}

            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                {/* Category header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#070c18] border-b border-slate-800/60">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: CAT_COLORS[category] ?? "#64748b",
                    }}
                  />
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: CAT_COLORS[category] ?? "#64748b" }}
                  >
                    {category}
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-slate-700">
                    {items.length}
                  </span>
                </div>

                {items.map((c) => {
                  const isSelected = c._id === value;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        onChange(c._id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-violet-500/10 text-white"
                          : "text-slate-300 hover:bg-slate-800/60",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs truncate">
                            {c.title}
                          </p>
                          {!c.isVisible && (
                            <span className="rounded-sm bg-slate-700/60 px-1 font-mono text-[8px] text-slate-500 shrink-0">
                              hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={cn(
                              "font-mono text-[9px]",
                              DIFF_CFG[c.difficulty]?.color,
                            )}
                          >
                            {c.difficulty}
                          </span>
                          <span className="font-mono text-[9px] text-amber-400/80">
                            {c.points} pts
                          </span>
                          <span className="font-mono text-[9px] text-slate-600">
                            {c.solveCount} solves
                          </span>
                          <span className="font-mono text-[9px] text-slate-700 ml-auto truncate">
                            {c._id.slice(-8)}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {challenges && (
            <div className="border-t border-slate-800 px-3 py-2">
              <p className="font-mono text-[10px] text-slate-700">
                {challenges.length} challenge
                {challenges.length !== 1 ? "s" : ""} available
                {search &&
                  ` · ${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
