import Link from "next/link";
import {
  CHALLENGE_DETAIL_CATEGORY_CONFIG,
  CHALLENGE_DETAIL_DIFF_CONFIG,
} from "../../config/challenge-detail-ui.config";
import { Challenge } from "../../types/challenge.types";
import { Check, ChevronLeft, Tag, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { DiffBars } from "./DiffBars";

/**
 * A header component for challenge cards in the challenges list page.
 *
 * Displays the challenge title, category, difficulty, points, solve count, and first blood information.
 *
 * Also includes a tags component if the challenge has tags.
 *
 * @param {Challenge} challenge - The challenge object to display.
 */
export function ChallengeHeader({ challenge }: { challenge: Challenge }) {
  const cat = CHALLENGE_DETAIL_CATEGORY_CONFIG[challenge.category];
  const diff = CHALLENGE_DETAIL_DIFF_CONFIG[challenge.difficulty];
  const Icon = cat.icon;

  const isSolved = !!challenge.solvedAt;
  const isClosed =
    challenge.closedAt && new Date(challenge.closedAt) < new Date();
  const decayed = challenge.currentPoints !== challenge.points;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/challenges"
          className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Challenges
        </Link>
        <span className="font-mono text-slate-800">/</span>
        <span className="font-mono text-xs" style={{ color: cat.color }}>
          {cat.label}
        </span>
      </div>

      {/* Title row */}
      <div className="flex items-start gap-5">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1",
            cat.bg,
          )}
          style={{ color: cat.color, borderColor: `${cat.color}30` }}
        >
          <Icon className="h-7 w-7" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.25em]"
              style={{ color: cat.color }}
            >
              {cat.label}
            </span>
            <div className="flex items-center gap-1.5">
              <DiffBars difficulty={challenge.difficulty} />
              <span
                className="font-mono text-[10px]"
                style={{ color: diff.color }}
              >
                {diff.label}
              </span>
            </div>
            {isSolved && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-400 ring-1 ring-emerald-500/20">
                <Check className="h-2.5 w-2.5" /> Solved
              </span>
            )}
            {isClosed && (
              <span className="rounded-full bg-slate-500/10 px-2 py-0.5 font-mono text-[9px] text-slate-600 ring-1 ring-slate-500/15">
                Closed
              </span>
            )}
          </div>

          <h1 className="font-mono text-2xl font-bold text-white leading-tight">
            {challenge.title}
          </h1>

          {/* Stats chips */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div>
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {challenge.currentPoints}
                </span>
                {decayed && (
                  <span className="ml-1 font-mono text-xs text-slate-600 line-through">
                    {challenge.points}
                  </span>
                )}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
                pts
              </span>
            </div>

            <div className="h-5 w-px bg-white/[0.07]" />

            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-700" />
              <span className="font-mono text-sm text-slate-400">
                {challenge.solveCount}
              </span>
              <span className="font-mono text-[10px] text-slate-700">
                solves
              </span>
            </div>

            {challenge.scoringType === "dynamic" && (
              <>
                <div className="h-5 w-px bg-white/[0.07]" />
                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-700">
                  <Zap className="h-3 w-3 text-amber-500/60" />
                  Dynamic — floor {challenge.minPoints}pts
                </span>
              </>
            )}

            {challenge.flagFormat && (
              <>
                <div className="h-5 w-px bg-white/[0.07]" />
                <span className="font-mono text-[10px] text-slate-600">
                  Format:{" "}
                  <span className="text-slate-400">{challenge.flagFormat}</span>
                </span>
              </>
            )}
          </div>

          {/* First blood */}
          {challenge.firstBlood && (
            <div className="mt-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-red-400" />
              <span className="font-mono text-[10px] text-slate-600">
                First blood:
              </span>
              <Link
                href={`/profile/${challenge.firstBlood.username}`}
                className="font-mono text-[10px] text-red-400 hover:text-red-300 transition-colors"
              >
                {challenge.firstBlood.username}
              </Link>
              <span className="font-mono text-[9px] text-slate-700">
                {formatDistanceToNow(new Date(challenge?.firstBlood?.solvedAt ?? 0), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {challenge.tags && challenge.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Tag className="h-3.5 w-3.5 text-slate-700 mt-0.5" />
          {challenge.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-xl bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-slate-500 ring-1 ring-white/[0.05]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
