import { CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useMarkNotificationsAsRead } from "../../hooks/useMarkNotificationAsRead";
import { useClearInbox } from "../../hooks/useClearInbox";

export function BulkActionsBar({ unreadCount }: { unreadCount: number }) {
  const { mutate: markRead, isPending: isMarkingRead } =
    useMarkNotificationsAsRead();
  const { mutate: clearAll, isPending: isClearing } = useClearInbox();

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 animate-in fade-in duration-300"
      style={{ animationDelay: "150ms", animationFillMode: "both" }}
    >
      <span className="font-mono text-xs text-slate-600">
        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      </span>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <button
            onClick={() => markRead([])}
            disabled={isMarkingRead}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] px-3 py-1.5 font-mono text-[10px] text-slate-500 hover:border-white/[0.12] hover:text-slate-300 disabled:opacity-50 transition-all"
          >
            {isMarkingRead ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            Mark all read
          </button>
        )}
        <button
          onClick={() => clearAll()}
          disabled={isClearing}
          className="flex items-center gap-1.5 rounded-xl border border-red-500/15 bg-red-950/10 px-3 py-1.5 font-mono text-[10px] text-red-400/70 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50 transition-all"
        >
          {isClearing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Clear all
        </button>
      </div>
    </div>
  );
}
