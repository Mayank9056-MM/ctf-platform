import { cn } from "@/lib/utils";
import { DIFF_CONFIG } from "@/modules/story/config/user-detail-ui.config";
import { Story, StoryProgressView } from "@/modules/story/types/story.types";
import { Clock, Loader2, Play, RotateCcw, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export function ProgressCard({
  story,
  progress,
  onStart,
  isStarting,
}: {
  story: Story;
  progress: StoryProgressView | null | undefined;
  onStart: () => void;
  isStarting: boolean;
}) {
  const totalNodes = story.chapters.reduce(
    (sum, ch) => sum + ch.nodes.length,
    0,
  );
  const completedNodes = progress?.completedNodeIds.length ?? 0;
  const pct =
    totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  const isCompleted = progress?.status === "completed";
  const isInProgress = progress?.status === "in_progress";
  const notStarted = !progress || progress.status === "abandoned";

  const diff = DIFF_CONFIG[story.difficulty];
  const DiffIcon = diff.icon;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d1117]/90 overflow-hidden">
      {/* Cover */}
      {story.coverImageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/30 to-transparent" />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Diff badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 ring-1",
            diff.bg,
            diff.ring,
          )}
        >
          <DiffIcon className={cn("h-3.5 w-3.5", diff.color)} />
          <span
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-wide",
              diff.color,
            )}
          >
            {diff.label}
          </span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
            <p className="font-mono text-base font-black tabular-nums text-white">
              {story.chapters.length}
            </p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-slate-700">
              Chapters
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
            <p className="font-mono text-base font-black tabular-nums text-white">
              {totalNodes}
            </p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-slate-700">
              Nodes
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
            <p className="font-mono text-base font-black tabular-nums text-white">
              {story.estimatedMinutes ?? "—"}
            </p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-slate-700">
              Mins
            </p>
          </div>
        </div>

        {/* XP reward */}
        {story.completionXpBonus > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-yellow-500/10 bg-yellow-500/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="font-mono text-xs text-yellow-400/80">
                Completion Bonus
              </span>
            </div>
            <span className="font-mono text-sm font-black text-yellow-400">
              +{story.completionXpBonus.toLocaleString()} XP
            </span>
          </div>
        )}

        {/* Progress bar (if started) */}
        {isInProgress && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-600">
                Progress
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-400">
                {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-[9px] text-slate-700">
                {completedNodes} / {totalNodes} nodes
              </span>
              <span className="font-mono text-[9px] text-slate-700">
                {progress.totalXpEarned.toLocaleString()} XP earned
              </span>
            </div>
          </div>
        )}

        {/* CTA button */}
        {isCompleted ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3 ring-1 ring-emerald-500/20">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <span className="font-mono text-sm font-bold text-emerald-400">
                Completed!
              </span>
            </div>
            <button
              onClick={onStart}
              disabled={isStarting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 font-mono text-xs text-slate-500 transition-all hover:border-white/[0.1] hover:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Play Again
            </button>
          </div>
        ) : isInProgress ? (
          <Link
            href={`/stories/${story.slug}/play`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-mono text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            Continue Story
          </Link>
        ) : (
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-3 font-mono text-sm font-bold text-white transition-all hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Begin Story
              </>
            )}
          </button>
        )}

        {/* Play time */}
        {progress?.playTimeFormatted && (
          <div className="flex items-center justify-center gap-1.5 text-slate-700">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-[10px]">
              {progress.playTimeFormatted} played
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
