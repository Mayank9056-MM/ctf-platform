import { StoryNode } from "@/modules/story/types/story.types";
import { CheckCircle2, ChevronRight, Flag, Loader2, Terminal, Zap } from "lucide-react";
import Link from "next/link";

export function ChallengeNodePanel({
  node,
  storySlug,
  challengeId,
  isCompleted,
  onContinue,
  isContinuing,
}: {
  node: StoryNode;
  storySlug: string;
  challengeId: string;
  isCompleted: boolean;
  onContinue: () => void;
  isContinuing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117]/90 p-8">
      <div className="mb-6 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-emerald-400" />
        <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
          Challenge Node
        </span>
        {node.xpBonus > 0 && (
          <div className="ml-auto flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 ring-1 ring-yellow-500/20">
            <Zap className="h-2.5 w-2.5 text-yellow-400" />
            <span className="font-mono text-[9px] font-bold text-yellow-400">+{node.xpBonus} XP</span>
          </div>
        )}
      </div>
 
      {node.preNarrative && (
        <div className="mb-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <p className="font-mono text-sm text-slate-400 leading-relaxed italic">
            &quot;{node.preNarrative}&quot;
          </p>
        </div>
      )}
 
      {isCompleted ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-mono text-sm font-bold text-emerald-400">Challenge Solved!</p>
            <p className="font-mono text-[11px] text-emerald-600">Flag accepted. Well done.</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
          <div className="flex items-start gap-3">
            <Flag className="h-4 w-4 text-emerald-500/60 mt-0.5 shrink-0" />
            <div>
              <p className="font-mono text-xs font-bold text-emerald-500/80 mb-1">Submit the flag to proceed</p>
              <p className="font-mono text-[11px] text-slate-700">
                Complete the associated challenge and submit the correct flag to unlock the next story node.
              </p>
            </div>
          </div>
        </div>
      )}
 
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/challenges/${challengeId}`}
          target="_blank"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] py-3 font-mono text-sm font-bold text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.1]"
        >
          <Terminal className="h-4 w-4" />
          Open Challenge
          <span className="text-emerald-700">↗</span>
        </Link>
        {isCompleted && (
          <button
            onClick={onContinue}
            disabled={isContinuing}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-mono text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60"
          >
            {isContinuing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue Story <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}