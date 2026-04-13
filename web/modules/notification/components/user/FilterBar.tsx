import { cn } from "@/lib/utils";
import { NotificationTypeValue } from "../../types/notification.types";
import { useInboxFilters } from "../../store/notification.store";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
] as const;

const TYPE_FILTERS: { id: NotificationTypeValue | "all"; label: string }[] = [
  { id: "all", label: "All Types" },
  { id: "submission_correct", label: "Solves" },
  { id: "submission_first_blood", label: "First Bloods" },
  { id: "team_invite_received", label: "Team" },
  { id: "admin_announcement", label: "System" },
  { id: "event_starting_soon", label: "Events" },
];

export function FilterBar() {
  const { filter, typeFilter, setFilter, setTypeFilter } = useInboxFilters();

  return (
    <div
      className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: "100ms", animationFillMode: "both" }}
    >
      {/* Read/unread tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-1">
        {FILTER_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              "flex-1 rounded-xl py-2.5 font-mono text-xs font-medium transition-all duration-150",
              filter === id
                ? "bg-white/[0.07] text-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTypeFilter(id)}
            className={cn(
              "rounded-xl px-3 py-1.5 font-mono text-[10px] font-medium transition-all",
              typeFilter === id
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25"
                : "border border-white/[0.05] text-slate-600 hover:border-white/[0.1] hover:text-slate-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
