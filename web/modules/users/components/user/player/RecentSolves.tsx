import { ChallengeCategory } from "@/modules/challenges/types/challenge.types";
import { CAT_CFG } from "@/modules/users/config/player-ui.config";
import { formatDistanceToNow } from "date-fns";
import { Crown, Flag, Zap } from "lucide-react";
import Link from "next/link";

export function RecentSolves({
  solves,
}: {
  solves: {
    _id: string;
    challenge: {
      _id: string;
      title: string;
      slug: string;
      category: string;
      difficulty: string;
      points: number;
      currentPoints: number;
    };
    pointsAwarded: number;
    isFirstBlood: boolean;
    createdAt: string;
  }[];
}) {
  if (!solves.length)
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-8 text-center">
        <Flag className="mx-auto mb-3 h-8 w-8 text-slate-700" />
        <p className="font-mono text-sm text-slate-600">No solves yet</p>
      </div>
    );

  const DIFF_COLORS: Record<string, string> = {
    easy: "#34d399",
    medium: "#fbbf24",
    hard: "#f97316",
    insane: "#f87171",
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
          Recent Solves ({solves.length})
        </p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {solves.slice(0, 10).map((s, i) => {
          const catCfg = CAT_CFG[s.challenge.category as ChallengeCategory];
          const diffClr = DIFF_COLORS[s.challenge.difficulty] ?? "#64748b";
          return (
            <div
              key={s._id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors animate-in fade-in slide-in-from-bottom-1"
              style={{
                animationDelay: `${i * 30}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="w-4 shrink-0">
                {i === 0 && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/challenges/${s.challenge.slug}`}
                  className="font-mono text-sm text-slate-300 hover:text-white transition-colors truncate block"
                >
                  {s.challenge.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: catCfg?.color }}
                  >
                    {catCfg?.label ?? s.challenge.category}
                  </span>
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: diffClr }}
                  >
                    {s.challenge.difficulty}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-bold text-white tabular-nums">
                  +{s.pointsAwarded}
                  {s.isFirstBlood && (
                    <Zap className="inline h-3 w-3 text-red-400 ml-0.5" />
                  )}
                </p>
                <p className="font-mono text-[9px] text-slate-700">
                  {formatDistanceToNow(new Date(s.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
