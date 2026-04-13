import { Filter } from "lucide-react";
import { useAnnouncementStore, useFeedFilters } from "../../store/announcement.store";
import { AnnouncementSeverity } from "../../types/announcement.types";
import { SEV } from "../../config/announcement-ui.config";
import { cn } from "@/lib/utils";

export function SeverityFilter() {
  const { severityFilter } = useFeedFilters();
  const setFilter = useAnnouncementStore((s) => s.setFeedSeverityFilter);
 
  const options: { id: AnnouncementSeverity | "all"; label: string }[] = [
    { id: "all",      label: "All"      },
    { id: "critical", label: "Critical" },
    { id: "warning",  label: "Warning"  },
    { id: "info",     label: "Info"     },
    { id: "success",  label: "Updates"  },
  ];
 
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-3.5 w-3.5 text-slate-700 shrink-0" />
      {options.map(({ id, label }) => {
        const cfg = id !== "all" ? SEV[id as AnnouncementSeverity] : null;
        const active = severityFilter === id;
        return (
          <button key={id} onClick={() => setFilter(id)}
            className={cn(
              "rounded-xl px-3 py-1.5 font-mono text-[10px] font-medium transition-all",
              active
                ? cfg
                  ? cn("ring-1", cfg.badgeBg, cfg.badgeText, cfg.badgeRing)
                  : "bg-white/[0.07] text-slate-200 ring-1 ring-white/[0.1]"
                : "border border-white/[0.05] text-slate-600 hover:border-white/[0.1] hover:text-slate-400"
            )}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
 