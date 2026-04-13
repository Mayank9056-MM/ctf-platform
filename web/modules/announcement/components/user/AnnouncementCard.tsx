import { cn } from "@/lib/utils";
import { useDismissAnnouncement } from "../../hooks/useDismissAnnouncement";
import { useAnnouncementStore } from "../../store/announcement.store";
import { AnnouncementFeedItem } from "../../types/announcement.types";
import Link from "next/link";
import { ChevronRight, ExternalLink, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "motion/react";
import { SEV } from "../../config/announcement-ui.config";

export function AnnouncementCard({
  item,
  index,
}: {
  item: AnnouncementFeedItem;
  index: number;
}) {
  const cfg = SEV[item.severity];
  const Icon = cfg.icon;
  const { mutate: dismiss, isPending: isDismissing } = useDismissAnnouncement();
  const optimisticDismiss = useAnnouncementStore((s) => s.optimisticDismiss);

  const handleDismiss = () => {
    optimisticDismiss(item._id);
    dismiss(item._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-200",
        cfg.cardBorder,
        cfg.cardBg,
        cfg.glow,
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl",
          cfg.accentBar,
        )}
      />

      <div className="px-5 py-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1"
              style={{
                backgroundColor: `${cfg.color}15`,
                color: cfg.color,
                borderColor: `${cfg.color}25`,
              }}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ring-1",
                    cfg.badgeBg,
                    cfg.badgeText,
                    cfg.badgeRing,
                  )}
                >
                  {cfg.label}
                </span>
                {item.challenge && (
                  <Link
                    href={`/challenges/${item.challenge.slug}`}
                    className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.challenge.title}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                )}
                {item.publishedAt && (
                  <span className="font-mono text-[9px] text-slate-700">
                    {formatDistanceToNow(new Date(item.publishedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-white leading-snug">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {item.body}
              </p>

              {item.actionUrl && (
                <Link
                  href={item.actionUrl}
                  target={
                    item.actionUrl.startsWith("http") ? "_blank" : undefined
                  }
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[10px] font-semibold transition-all ring-1"
                  style={{
                    color: cfg.color,
                    backgroundColor: `${cfg.color}15`,
                    borderColor: `${cfg.color}25`,
                  }}
                >
                  {item.actionLabel ?? "View details"}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Dismiss */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDismiss}
                disabled={isDismissing}
                className="shrink-0 rounded-xl p-1.5 text-slate-700 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.06] hover:text-slate-400 disabled:opacity-50"
              >
                {isDismissing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Dismiss</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}
