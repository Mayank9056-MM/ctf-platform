import { cn } from "@/lib/utils";
import { useStoryLeaderboard } from "@/modules/story/hooks/useStoryLeaderboard";
import { Trophy } from "lucide-react";

export function LeaderboardCard({ storyId }: { storyId: string }) {
  const { data } = useStoryLeaderboard(storyId, 1, true);
  const entries = data?.leaderboard?.slice(0, 5) ?? [];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d1117]/90 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
          Top Completions
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-center font-mono text-xs text-slate-700 py-4">
          No completions yet. Be the first!
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={entry.userId} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-5 font-mono text-[10px] font-black text-center",
                  i === 0 && "text-yellow-400",
                  i === 1 && "text-slate-400",
                  i === 2 && "text-amber-600",
                  i > 2 && "text-slate-700",
                )}
              >
                #{entry.rank}
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] overflow-hidden">
                {entry.avatar?.url ? (
                  <img
                    src={entry.avatar.url}
                    alt={entry.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-[8px] font-bold text-slate-400">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-slate-400 truncate">
                  {entry.username}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[9px] text-yellow-500">
                {entry.totalXpEarned.toLocaleString()} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
