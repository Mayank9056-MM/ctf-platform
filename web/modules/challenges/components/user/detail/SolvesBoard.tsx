import { cn } from "@/lib/utils";
import { useChallengeSolves } from "@/modules/challenges/hooks/useChallengesSolves";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, Crown, Medal, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/**
 * A component that displays a list of solves for a challenge,
 * along with their ranking, points awarded, and solve time.
 *
 * @param challengeId - The ID of the challenge to display solves for.
 * @param solveCount - The total number of solves for the challenge.
 */
export function SolvesBoard({
  challengeId,
  solveCount,
}: {
  challengeId: string;
  solveCount: number;
}) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
const { data, isLoading } = useChallengeSolves(challengeId, page, open);
  const solves = data?.solves ?? [];
  const meta = data?.meta;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-slate-600" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
            Solve Board
          </span>
          <span className="font-mono text-[10px] text-slate-800">
            ({solveCount})
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-600 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-white/[0.05]">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : solves.length === 0 ? (
            <p className="p-5 font-mono text-xs text-slate-700 text-center">
              No solves yet. Be first!
            </p>
          ) : (
            <>
              <div className="divide-y divide-white/[0.04]">
                {solves.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    {/* Rank */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                      {s.rank === 1 ? (
                        <Crown className="h-4 w-4 text-yellow-400" />
                      ) : s.rank === 2 ? (
                        <Medal className="h-4 w-4 text-slate-300" />
                      ) : s.rank === 3 ? (
                        <Medal className="h-4 w-4 text-amber-600" />
                      ) : (
                        <span className="font-mono text-[11px] text-slate-600">
                          {s.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-xl bg-white/[0.07] ring-1 ring-white/[0.08]">
                      {s.user.avatar?.url ? (
                        <Image
                          src={s.user.avatar.url}
                          alt={s.user.username}
                          width={28}
                          height={28}
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[9px] font-bold text-slate-500">
                          {s.user.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${s.user.username}`}
                        className="font-mono text-xs text-slate-300 hover:text-white transition-colors truncate block"
                      >
                        {s.user.username}
                      </Link>
                      {s.team && (
                        <p className="font-mono text-[9px] text-slate-700 truncate">
                          [{s.team.name}]
                        </p>
                      )}
                    </div>

                    {/* Points + time */}
                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs font-bold text-white tabular-nums">
                        +{s.pointsAwarded}
                        {s.isFirstBlood && (
                          <Zap className="inline h-2.5 w-2.5 text-red-400 ml-0.5" />
                        )}
                      </p>
                      <p className="font-mono text-[9px] text-slate-700">
                        {formatDistanceToNow(new Date(s.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!meta.hasPrev}
                    className="font-mono text-[10px] text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="font-mono text-[10px] text-slate-700">
                    {meta.page}/{meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!meta.hasNext}
                    className="font-mono text-[10px] text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}