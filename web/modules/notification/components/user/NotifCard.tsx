import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppNotification } from "../../types/notification.types";
import { getConfig } from "../../config/notification-ui.config";
import { useMarkNotificationsAsRead } from "../../hooks/useMarkNotificationAsRead";
import { useDeleteNotification } from "../../hooks/useDeleteNotification";
import { useDismissNotification } from "../../hooks/useDismissNotifcation";
import { useNotificationStore } from "../../store/notification.store";

export function NotifCard({
  notif,
  index,
  isOptimisticallyDeleted,
}: {
  notif: AppNotification;
  index: number;
  isOptimisticallyDeleted: boolean;
}) {
  const cfg = getConfig(notif.type);
  const Icon = cfg.icon;
  const { mutate: markRead } = useMarkNotificationsAsRead();
  const { mutate: deleteNotif, isPending: isDeleting } =
    useDeleteNotification();
  const { mutate: dismiss } = useDismissNotification();
  const { optimisticallyDelete } = useNotificationStore();

  if (isOptimisticallyDeleted) return null;

  const handleDelete = () => {
    optimisticallyDelete(notif._id);
    deleteNotif(notif._id);
  };

  const handleMarkRead = () => {
    if (!notif.isRead) markRead([notif._id]);
  };

  const timeAgo = formatDistanceToNow(new Date(notif.createdAt), {
    addSuffix: true,
  });

  const inner = (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border px-5 py-4 transition-all duration-200 cursor-pointer",
        "animate-in fade-in slide-in-from-bottom-1",
        notif.isRead
          ? "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.07] hover:bg-white/[0.03]"
          : "border-emerald-500/15 bg-emerald-950/10 hover:border-emerald-500/25 hover:bg-emerald-950/15",
      )}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
      onClick={handleMarkRead}
    >
      {/* Unread indicator */}
      {!notif.isRead && (
        <span className="absolute left-3 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-emerald-400" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
          cfg.bg,
          notif.isRead ? "ring-white/[0.06]" : "ring-emerald-500/20",
        )}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
              {notif.isBroadcast && (
                <span className="font-mono text-[9px] text-slate-700">
                  broadcast
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-sm leading-snug mt-0.5",
                notif.isRead
                  ? "text-slate-400"
                  : "font-semibold text-slate-100",
              )}
            >
              {notif.title}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {notif.body}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="shrink-0 rounded-lg p-1 text-slate-700 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-mono text-[10px] text-slate-700">
            {timeAgo}
          </span>
          {notif.actionUrl && (
            <Link
              href={notif.actionUrl}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[10px] transition-colors hover:text-emerald-400"
              style={{ color: cfg.color }}
            >
              View →
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return inner;
}
