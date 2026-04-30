import { NodeCompleteResult } from "@/modules/story/types/story.types";
import { CheckCircle2, Star, Trophy, Zap } from "lucide-react";
import { useEffect } from "react";

export function NodeCompleteOverlay({
  result,
  onClose,
}: {
  result: NodeCompleteResult;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0d1117]/98 p-8 text-center shadow-2xl">
        {result.storyCompleted ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 ring-2 ring-yellow-500/30">
              <Trophy className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="mb-1 font-mono text-xl font-black text-white">Story Complete!</h2>
            <p className="mb-4 font-mono text-xs text-slate-600">
              You&apos;ve completed the entire story arc.
            </p>
          </>
        ) : result.chapterCompleted ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-1 font-mono text-xl font-black text-white">Chapter Complete!</h2>
            <p className="mb-4 font-mono text-xs text-slate-600">
              Moving to the next chapter…
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <Star className="h-6 w-6 text-violet-400" />
            </div>
            <h2 className="mb-1 font-mono text-base font-black text-white">Node Cleared</h2>
          </>
        )}
 
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-yellow-500/10 px-4 py-2.5 ring-1 ring-yellow-500/20">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="font-mono text-sm font-black text-yellow-400">
            +{result.xpBonus} XP
          </span>
          {result.storyCompleted && (
            <>
              <span className="text-yellow-700">+</span>
              <span className="font-mono text-sm font-black text-yellow-400">
                {result.completionXpBonus} bonus
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}