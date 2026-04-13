import { UserProfile } from "@/modules/users/types/user.types";
import { StatCard } from "./StatCard";
import { Activity, Flag, Trophy, Zap } from "lucide-react";

export function OverviewTab({
  user,
  stats,
}: {
  user: UserProfile;
  stats: any;
}) {
  // Sparkline
  const activity = stats?.recentActivity ?? [];
  const maxCount = Math.max(...activity.map((d) => d.count), 1);

  // Provider badges
  const providerBadge: Record<string, string> = {
    local: "#64748b",
    google: "#ea4335",
    github: "#f0f6fc",
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Trophy}
          value={stats?.totalPointsEarned ?? user.score}
          label="Score"
          color="#f59e0b"
          delay={0}
        />
        <StatCard
          icon={Flag}
          value={stats?.challengesSolved ?? user.solvedChallenges?.length ?? 0}
          label="Solved"
          color="#34d399"
          delay={50}
        />
        <StatCard
          icon={Zap}
          value={stats?.firstBloods ?? 0}
          label="1st Bloods"
          color="#ef4444"
          delay={100}
        />
        <StatCard
          icon={Activity}
          value={`${stats?.streak ?? 0}d`}
          label="Streak"
          color="#f97316"
          delay={150}
        />
      </div>

      {/* Activity sparkline */}
      {activity.length > 0 && (
        <div
          className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 animate-in fade-in duration-500"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-3">
            30-day activity
          </p>
          <div className="flex h-12 items-end gap-0.5">
            {Array.from({ length: 30 }).map((_, i) => {
              const entry = activity.find((a) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return a.date === date.toISOString().slice(0, 10);
              });
              const h = entry ? Math.max(8, (entry.count / maxCount) * 100) : 0;
              return (
                <div
                  key={i}
                  title={entry ? `${entry.count} submissions` : "No activity"}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      h > 0
                        ? entry?.count >= maxCount * 0.6
                          ? "#34d399"
                          : "#134e2e"
                        : "transparent",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Auth providers */}
      {user.providers?.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-3">
            Auth Methods
          </p>
          <div className="flex flex-wrap gap-2">
            {user.providers.map((p) => (
              <div
                key={p.provider}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: providerBadge[p.provider] ?? "#64748b",
                  }}
                />
                <span className="font-mono text-[10px] capitalize text-slate-400">
                  {p.provider}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hints purchased */}
      {(user.hintsPurchased?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-1">
            Hints Purchased
          </p>
          <p className="font-mono text-2xl font-bold text-white">
            {user.hintsPurchased!.length}
          </p>
        </div>
      )}

      {/* Additional stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-1">
            Solve Rate
          </p>
          <p className="font-mono text-xl font-bold text-white">
            {stats?.solveRate ?? 0}%
          </p>
          <div className="mt-2 h-0.5 rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-emerald-500/60"
              style={{ width: `${stats?.solveRate ?? 0}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-1">
            Avg Attempts
          </p>
          <p className="font-mono text-xl font-bold text-white">
            {stats?.averageAttemptsPerSolve ?? 1}
          </p>
          <p className="font-mono text-[9px] text-slate-700 mt-0.5">
            per correct solve
          </p>
        </div>
      </div>
    </div>
  );
}
