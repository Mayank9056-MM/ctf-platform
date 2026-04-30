import { Story, StoryChapter, StoryProgressView } from "@/modules/story/types/story.types";
import { BookOpen, Zap } from "lucide-react";

export function Minimap({
  story,
  progress,
  currentChapter,
}: {
  story: Story;
  progress: StoryProgressView;
  currentChapter: StoryChapter | null;
}) {
  const totalNodes = story.chapters.reduce((s, c) => s + c.nodes.length, 0);
  const completed = progress.completedNodeIds.length;
  const pct = totalNodes > 0 ? Math.round((completed / totalNodes) * 100) : 0;
 
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-slate-600" />
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[9px] text-slate-600 truncate max-w-[140px]">
            {currentChapter?.title ?? "Loading…"}
          </span>
          <span className="font-mono text-[9px] font-bold text-slate-500 ml-2 shrink-0">{pct}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-yellow-500/10 px-2 py-0.5 ring-1 ring-yellow-500/20">
        <Zap className="h-2.5 w-2.5 text-yellow-400" />
        <span className="font-mono text-[9px] font-bold text-yellow-400">
          {progress.totalXpEarned.toLocaleString()}
        </span>
      </div>
    </div>
  );
}