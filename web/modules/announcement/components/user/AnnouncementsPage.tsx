"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useAnnouncementFeed } from "../../hooks/useAnnoucementFeed";
import { useAnnouncementStore, useFeedFilters } from "../../store/announcement.store";
import { AnnouncementSeverity } from "../../types/announcement.types";
import { AlertCircle, Megaphone } from "lucide-react";
import { SeverityFilter } from "./SeverityFilter";
import { AnimatePresence } from "motion/react";
import { CriticalBanner } from "./CriticalBanner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./ui/EmptyState";
import { AnnouncementCard } from "./AnnouncementCard";
import { Pagination } from "./ui/Pagination";
import { Ambient } from "./ui/Ambient";

export default function AnnouncementsPage() {
  const { page, severityFilter, dismissedIds } = useFeedFilters();
  const setFeedPage = useAnnouncementStore((s) => s.setFeedPage);
 
  const { announcements, meta, isLoading, isError, refetch } = useAnnouncementFeed({
    page, limit: 12,
    ...(severityFilter !== "all" && { severity: severityFilter as AnnouncementSeverity }),
  });
 
  // Split: critical pinned, rest below
  const criticals = announcements.filter(
    (a) => a.severity === "critical" && !dismissedIds.has(a._id) && !a.isDismissed
  );
  const rest = announcements.filter(
    (a) => a.severity !== "critical" && !dismissedIds.has(a._id)
  );
 
  const isFiltered = severityFilter !== "all";
 
  return (
    <TooltipProvider>
      <Ambient />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="space-y-6">
 
          {/* Header */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25">
                <Megaphone className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60">
                  {"// Operator Comms"}
                </p>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
                  Announcements
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-500 ml-16">
              Official dispatches from command. Stay informed on platform updates and events.
            </p>
          </div>
 
          {/* Severity filter */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "80ms", animationFillMode: "both" }}>
            <SeverityFilter />
          </div>
 
          {/* Critical banners pinned at top */}
          <AnimatePresence>
            {criticals.length > 0 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {criticals.map((a) => <CriticalBanner key={a._id} item={a} />)}
              </div>
            )}
          </AnimatePresence>
 
          {/* Regular cards */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "160ms", animationFillMode: "both" }}>
 
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.06]" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-2.5 w-16 animate-pulse rounded bg-white/[0.07]" />
                        <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-2.5 w-full animate-pulse rounded bg-white/[0.04]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-red-400/50" />
                <p className="font-mono text-sm text-red-400/70">Failed to load announcements</p>
                <Button variant="ghost" size="sm" onClick={() => refetch()}
                  className="font-mono text-xs text-slate-600 hover:text-slate-300">
                  Try again
                </Button>
              </div>
            ) : rest.length === 0 && criticals.length === 0 ? (
              <EmptyState filtered={isFiltered} />
            ) : (
              <AnimatePresence>
                {rest.map((a, i) => (
                  <AnnouncementCard key={a._id} item={a} index={i} />
                ))}
              </AnimatePresence>
            )}
          </div>
 
          {/* Pagination */}
          {meta && meta.totalPages > 1 && !isLoading && (
            <Pagination meta={meta} page={page} setPage={setFeedPage} />
          )}
 
        </div>
      </div>
    </TooltipProvider>
  );
}