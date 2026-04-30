import { cn } from "@/lib/utils";
import {
  StoryChapter,
  StoryProgressView,
} from "@/modules/story/types/story.types";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { NodeCard } from "./NodeCard";
import { getNodeStatus } from "./getNodeStatus";

export function ChapterAccordion({
  chapter,
  index,
  progress,
  isCurrentChapter,
  defaultOpen,
}: {
  chapter: StoryChapter;
  index: number;
  progress: StoryProgressView | null | undefined;
  isCurrentChapter: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const completedNodes = chapter.nodes.filter((n) =>
    progress?.completedNodeIds.includes(n._id),
  ).length;
  const totalNodes = chapter.nodes.length;
  const pct = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
  const isChapterComplete = completedNodes === totalNodes && totalNodes > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        isCurrentChapter
          ? "border-violet-500/30 bg-[#0d0f18]"
          : isChapterComplete
            ? "border-emerald-500/15 bg-[#0a0e15]/60"
            : "border-white/[0.05] bg-[#0a0e15]/40",
      )}
    >
      {/* Chapter header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        {/* Chapter number */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black ring-1",
            isChapterComplete
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
              : isCurrentChapter
                ? "bg-violet-500/10 text-violet-400 ring-violet-500/30"
                : "bg-white/[0.04] text-slate-600 ring-white/[0.06]",
          )}
        >
          {isChapterComplete ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            String(index + 1).padStart(2, "0")
          )}
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-white">
              {chapter.title}
            </span>
            {isCurrentChapter && (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-mono text-[9px] text-violet-400 ring-1 ring-violet-500/20">
                Current
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  isChapterComplete ? "bg-emerald-500" : "bg-violet-500/60",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[9px] text-slate-600">
              {completedNodes}/{totalNodes}
            </span>
          </div>
        </div>

        {/* Toggle */}
        <div className="shrink-0 text-slate-700">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Node list */}
      {open && (
        <div className="border-t border-white/[0.04] p-4 space-y-2">
          {chapter.openingNarrative && (
            <div className="mb-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.04] px-4 py-3">
              <p className="font-mono text-[11px] text-blue-400/70 italic leading-relaxed line-clamp-3">
                &quot;{chapter.openingNarrative.slice(0, 160)}
                {chapter.openingNarrative.length > 160 && "…"}&quot;
              </p>
            </div>
          )}
          {chapter.nodes.map((node) => (
            <NodeCard
              key={node._id}
              node={node}
              status={getNodeStatus(node._id, progress)}
              isCurrentChapter={isCurrentChapter}
            />
          ))}
          {chapter.closingNarrative && isChapterComplete && (
            <div className="mt-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3">
              <p className="font-mono text-[11px] text-emerald-400/70 italic leading-relaxed line-clamp-3">
                &quot;{chapter.closingNarrative.slice(0, 160)}
                {chapter.closingNarrative.length > 160 && "…"}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
