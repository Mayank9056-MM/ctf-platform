import { cn } from "@/lib/utils";
import { fmt } from "@/shared/utils/fmt";
import { motion } from "motion/react";

/**
 * A single row in the top solver table.
 *
 * @param {{object}} solver - a top solver entry
 * @param {{number}} rank - the rank of the solver in the table
 * @param {{number}} delay - animation delay in seconds
 *
 * @returns a motion.div containing the solver entry
 */
export function SolverRow({
  solver,
  rank,
  delay,
}: {
  solver: {
    _id: string;
    username: string;
    score: number;
    solvedCount: number;
    country?: string;
  };
  rank: number;
  delay: number;
}) {
  const rankColors = ["text-amber-400", "text-slate-300", "text-amber-600"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0"
    >
      <span
        className={cn(
          "font-mono text-sm font-bold w-5 text-right shrink-0",
          rankColors[rank - 1] ?? "text-slate-600",
        )}
      >
        #{rank}
      </span>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <span className="font-mono text-[10px] text-emerald-400">
          {solver.username.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate font-mono">
          {solver.username}
        </p>
        <p className="text-[11px] text-slate-500">
          {solver.solvedCount} solves
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold text-emerald-400">
          {fmt(solver.score)}
        </p>
        {solver.country && (
          <p className="text-[10px] text-slate-600 uppercase">
            {solver.country}
          </p>
        )}
      </div>
    </motion.div>
  );
}
