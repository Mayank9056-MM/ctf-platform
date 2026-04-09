import { CheckCircle2, XCircle } from "lucide-react";
import { timeAgo } from "../../helpers/helpers";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const ACTION_STYLES: Record<string, { color: string; bg: string }> = {
  "user:ban": { color: "text-red-400", bg: "bg-red-500/10" },
  "user:unban": { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "user:delete": { color: "text-red-400", bg: "bg-red-500/10" },
  "user:role_change": { color: "text-amber-400", bg: "bg-amber-500/10" },
  "user:score_update": { color: "text-cyan-400", bg: "bg-cyan-500/10" },
  "user:update_profile": { color: "text-slate-400", bg: "bg-slate-700/40" },
  "admin:bulk_reset_scores": {
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
};

/**
 * A single row in the audit log table.
 *
 * @param log - an audit log entry
 * @param delay - animation delay in seconds
 *
 * @returns a motion.div containing the log entry
 */
export function AuditRow({
  log,
  delay,
}: {
  log: {
    _id: string;
    action: string;
    summary?: string;
    outcome: string;
    createdAt: Date | string;
  };
  delay: number;
}) {
  const style = ACTION_STYLES[log.action] ?? {
    color: "text-slate-400",
    bg: "bg-slate-700/40",
  };
  const shortAction =
    log.action.split(":")[1]?.replace(/_/g, " ") ?? log.action;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-start gap-3 py-2.5 border-b border-slate-800/50 last:border-0"
    >
      <div
        className={cn(
          "mt-0.5 rounded px-2 py-0.5 text-[10px] font-mono shrink-0",
          style.bg,
          style.color,
        )}
      >
        {shortAction}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">
          {log.summary ?? log.action}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {log.outcome === "success" ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">
          {timeAgo(log.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}