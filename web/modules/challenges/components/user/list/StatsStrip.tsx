import { useMemo } from "react";
import {
  ChallengeCategory,
  ChallengeSummary,
} from "../../../types/challenge.types";
import { CHALLENGE_LIST_CATEGORY_CONFIG } from "../../../config/challenge-list-ui.config";

export function StatsStrip({
  challenges,
  solvedIds,
}: {
  challenges: ChallengeSummary[];
  solvedIds: Set<string>;
}) {
  const byCategory = useMemo(() => {
    const map: Partial<
      Record<ChallengeCategory, { total: number; solved: number }>
    > = {};
    for (const c of challenges) {
      if (!map[c.category]) map[c.category] = { total: 0, solved: 0 };
      map[c.category]!.total++;
      if (solvedIds.has(c._id)) map[c.category]!.solved++;
    }
    return map;
  }, [challenges, solvedIds]);

  return (
    <div
      className="flex flex-wrap gap-2 animate-in fade-in duration-500"
      style={{ animationDelay: "60ms", animationFillMode: "both" }}
    >
      {(
        Object.entries(byCategory) as [
          ChallengeCategory,
          { total: number; solved: number },
        ][]
      )
        .sort((a, b) => b[1].total - a[1].total)
        .map(([cat, stats]) => {
          const cfg = CHALLENGE_LIST_CATEGORY_CONFIG[cat];
          const Icon = cfg.icon;
          const pct = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
          return (
            <div
              key={cat}
              className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2"
            >
              <Icon className="h-3 w-3 shrink-0" style={{ color: cfg.color }} />
              <span
                className="font-mono text-[10px] font-medium"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
              <span className="font-mono text-[10px] text-slate-600 tabular-nums">
                {stats.solved}/{stats.total}
              </span>
              {pct === 100 && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
          );
        })}
    </div>
  );
}
