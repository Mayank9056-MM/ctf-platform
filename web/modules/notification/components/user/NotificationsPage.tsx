"use client";

import { AlertCircle } from "lucide-react";
import {
  useInboxFilters,
  useOptimisticSets,
} from "../../store/notification.store";
import { useNotifications } from "../../hooks/useNotifications";
import { useInboxSummary } from "../../hooks/useInboxSummary";
import { PageHeader } from "./ui/PageHeader";
import { Ambient } from "../../../../shared/components/ui/Ambient";
import { FilterBar } from "./FilterBar";
import { BulkActionsBar } from "./BulkActionsBar";
import { EmptyState } from "./ui/EmptyState";
import { NotifCard } from "./NotifCard";
import { Pagination } from "./ui/Pagination";

export default function NotificationsPage() {
  const { filter, typeFilter, page, setPage } = useInboxFilters();
  const { deletedIds } = useOptimisticSets();

  const filters = {
    page,
    limit: 20,
    ...(filter === "unread" && { isRead: false }),
    ...(typeFilter !== "all" && { type: typeFilter }),
    includeBroadcasts: true,
  };

  const { data, isLoading, isError, refetch } = useNotifications(filters);
  const { data: summary } = useInboxSummary();

  const notifications = (data?.notifications ?? []).filter(
    (n) => !deletedIds.has(n._id),
  );
  const meta = data?.meta;
  const unreadCount = summary?.unreadCount ?? 0;
  const isFiltered = filter !== "all" || typeFilter !== "all";

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="space-y-6">
          <PageHeader unreadCount={unreadCount} />
          <FilterBar />
          <BulkActionsBar unreadCount={unreadCount} />

          {/* Notification list */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-2"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-5 py-4"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-1/4 animate-pulse rounded bg-white/[0.06]" />
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-400/50" />
                <p className="font-mono text-sm text-red-400/70">
                  Failed to load notifications
                </p>
                <button
                  onClick={() => refetch()}
                  className="font-mono text-xs text-slate-600 hover:text-slate-300 transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState filtered={isFiltered} />
            ) : (
              notifications.map((n, i) => (
                <NotifCard
                  key={n._id}
                  notif={n}
                  index={i}
                  isOptimisticallyDeleted={deletedIds.has(n._id)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && !isLoading && (
            <Pagination meta={meta} page={page} setPage={setPage} />
          )}
        </div>
      </div>
    </>
  );
}
