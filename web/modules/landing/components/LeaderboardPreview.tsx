import { cn } from "@/lib/utils";
import Link from "next/link";
import { LEADERBOARD_PREVIEW } from "../data/landing.data";
import { useInView, motion } from "motion/react";
import { useRef } from "react";

export function LeaderboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 32 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Global Leaderboard
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">LIVE</span>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[2.5rem_1fr_auto] gap-3 px-5 py-2 border-b border-slate-800/40">
        {["#", "Hacker", "Score"].map((h) => (
          <span
            key={h}
            className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600"
          >
            {h}
          </span>
        ))}
      </div>

      {LEADERBOARD_PREVIEW.map((entry, i) => (
        <motion.div
          key={entry.rank}
          initial={{ opacity: 0, x: 16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          className="grid grid-cols-[2.5rem_1fr_auto] gap-3 items-center px-5 py-3.5 border-b border-slate-800/30 last:border-0 hover:bg-slate-800/30 transition-colors group"
        >
          <span
            className={cn(
              "font-mono text-sm font-black",
              entry.rank === 1
                ? "text-amber-400"
                : entry.rank === 2
                  ? "text-slate-300"
                  : entry.rank === 3
                    ? "text-amber-600"
                    : "text-slate-600",
            )}
          >
            {entry.rank === 1 ? "⬡" : String(entry.rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                {entry.name}
              </span>
              <span className="text-xs">{entry.country}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-600 truncate">
              {entry.team}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
            {entry.score.toLocaleString()}
          </span>
        </motion.div>
      ))}

      <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-800/40">
        <Link
          href="/leaderboard"
          className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
        >
          View full leaderboard →
        </Link>
      </div>
    </motion.div>
  );
}
