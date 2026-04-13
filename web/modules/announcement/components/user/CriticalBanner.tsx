import { AlertCircle, ExternalLink, X } from "lucide-react";
import { useDismissAnnouncement } from "../../hooks/useDismissAnnouncement";
import { useAnnouncementStore } from "../../store/announcement.store";
import { AnnouncementFeedItem } from "../../types/announcement.types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { motion } from "motion/react";

export function CriticalBanner({ item }: { item: AnnouncementFeedItem }) {
  const { mutate: dismiss } = useDismissAnnouncement();
  const optimisticDismiss = useAnnouncementStore((s) => s.optimisticDismiss);

  const handleDismiss = () => {
    optimisticDismiss(item._id);
    dismiss(item._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rounded-2xl border border-red-500/30 bg-red-950/15 shadow-[0_0_40px_rgba(248,113,113,0.06)]"
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/30">
          <AlertCircle className="h-4.5 w-4.5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-red-400 ring-1 ring-red-500/25 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              Critical
            </span>
            {item.publishedAt && (
              <span className="font-mono text-[9px] text-slate-700">
                {formatDistanceToNow(new Date(item.publishedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-0.5 text-xs text-red-300/70 leading-relaxed">
            {item.body}
          </p>
          {item.actionUrl && (
            <Link
              href={item.actionUrl}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              {item.actionLabel ?? "Learn more"}{" "}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-xl p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
