import { ChallengeCategory } from "@/modules/challenges/types/challenge.types";
import { CAT_CFG } from "@/modules/users/config/player-ui.config";

export function CategoryBreakdown({
  solves,
}: {
  solves: { category: string; count: number }[];
}) {
  if (!solves.length) return null;
  const max = Math.max(...solves.map((s) => s.count), 1);
 
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-4">
        Solves by Category
      </p>
      <div className="space-y-2.5">
        {solves.sort((a, b) => b.count - a.count).map((s) => {
          const cfg = CAT_CFG[s.category as ChallengeCategory];
          const pct = (s.count / max) * 100;
          return (
            <div key={s.category} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-mono text-[10px] text-slate-500"
                style={{ color: cfg?.color }}>
                {cfg?.label ?? s.category}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: cfg?.color ?? "#64748b" }} />
              </div>
              <span className="w-6 shrink-0 text-right font-mono text-[10px] text-slate-600">
                {s.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
 