import { useState } from "react";
import { useAdminStore } from "../../store/admin.store";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Filter, Search, X, XCircle } from "lucide-react";
import { AdminUserFilters, UserRole } from "../../types/admin.types";
import {
  PAGE_SIZES,
  ROLE_CONFIG,
  SORT_OPTIONS,
} from "../../constants/admin.constants";
import { AnimatePresence, motion } from "motion/react";

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

/**
 * A filter chip component for displaying a filter label with an active state.
 * It takes in a label, an active state, and an onClick function.
 * When the chip is clicked, the onClick function is called.
 * The component renders a button with a rounded-full shape, a px-3 padding, a py-1 padding, and a font-mono font.
 * The button's className is determined by the active state. If the chip is active, the button has a border-emerald-500/30 and a bg-emerald-500/10, and the text is colored with text-emerald-400. If the chip is not active, the button has a border-slate-700 and a text-slate-500, and the text is colored with text-slate-300 on hover.
 */
const FilterChip = ({ label, active, onClick }: FilterChipProps) => (
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

/**
 * A filter bar component for filtering users in the admin dashboard.
 *
 * It provides a search input, a dropdown for selecting the sort order, and a
 * toggleable section for more filters.
 *
 * The more filters section provides a dropdown for selecting the page size,
 * a toggle for filtering banned users, unverified users, verified users,
 * and users with or without a team.
 *
 * The component also provides a clear button for clearing all filters.
 */
export function FilterBar() {
  const filters = useAdminStore((s) => s.userFilters);
  const setFilters = useAdminStore((s) => s.setUserFilters);
  const reset = useAdminStore((s) => s.resetUserFilters);
  const [showMore, setShowMore] = useState(false);

  const hasActive =
    !!filters.search ||
    !!filters.role ||
    filters.isBanned !== undefined ||
    filters.isVerified !== undefined ||
    !!filters.country;

  return (
    <div className="space-y-3 border-b border-slate-800/60 pb-4 mb-4">
      {/* Search + sort row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters({ search: e.target.value || undefined })
            }
            placeholder="Search users..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ search: undefined })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({
                sortBy: e.target.value as AdminUserFilters["sortBy"],
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              setFilters({
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
            title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Page size */}
        <select
          value={filters.limit}
          onChange={(e) =>
            setFilters({ limit: Number(e.target.value), page: 1 })
          }
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500 font-mono"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>

        {/* More filters toggle */}
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
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors font-mono"
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
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
                Role:
              </span>
              {(["user", "admin", "superadmin"] as UserRole[]).map((r) => (
                <FilterChip
                  key={r}
                  label={ROLE_CONFIG[r].label}
                  active={filters.role === r}
                  onClick={() =>
                    setFilters({ role: filters.role === r ? undefined : r })
                  }
                />
              ))}
              <div className="w-px h-6 bg-slate-800 self-center mx-1" />
              <FilterChip
                label="Banned"
                active={filters.isBanned === true}
                onClick={() =>
                  setFilters({
                    isBanned: filters.isBanned === true ? undefined : true,
                  })
                }
              />
              <FilterChip
                label="Unverified"
                active={filters.isVerified === false}
                onClick={() =>
                  setFilters({
                    isVerified:
                      filters.isVerified === false ? undefined : false,
                  })
                }
              />
              <FilterChip
                label="Verified"
                active={filters.isVerified === true}
                onClick={() =>
                  setFilters({
                    isVerified: filters.isVerified === true ? undefined : true,
                  })
                }
              />
              <FilterChip
                label="Has team"
                active={filters.hasTeam === true}
                onClick={() =>
                  setFilters({
                    hasTeam: filters.hasTeam === true ? undefined : true,
                  })
                }
              />
              <FilterChip
                label="No team"
                active={filters.hasTeam === false}
                onClick={() =>
                  setFilters({
                    hasTeam: filters.hasTeam === false ? undefined : false,
                  })
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
