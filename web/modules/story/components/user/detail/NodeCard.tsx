import { CheckCircle2, Lock, Zap } from "lucide-react";
import { NodeTypeBadge } from "./NodeTypeBadge";
import { StoryNode } from "@/modules/story/types/story.types";
import { cn } from "@/lib/utils";

export function NodeCard({
  node,
  status,
  isCurrentChapter,
}: {
  node: StoryNode;
  status: "completed" | "current" | "locked" | "available";
  isCurrentChapter: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-200",
        status === "completed" && "border-emerald-500/20 bg-emerald-500/[0.04]",
        status === "current" &&
          "border-violet-500/40 bg-violet-500/[0.06] ring-1 ring-violet-500/20",
        status === "available" &&
          "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]",
        status === "locked" && "border-white/[0.03] bg-white/[0.01] opacity-40",
      )}
    >
      {/* Status dot */}
      <div className="mt-0.5 shrink-0">
        {status === "completed" && (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        )}
        {status === "current" && (
          <div className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-violet-500/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
          </div>
        )}
        {status === "available" && (
          <div className="h-4 w-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
        )}
        {status === "locked" && <Lock className="h-4 w-4 text-slate-700" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <NodeTypeBadge type={node.type} />
          {node.isOptional && (
            <span className="rounded-md bg-slate-500/10 px-1.5 py-0.5 font-mono text-[8px] text-slate-600 ring-1 ring-white/5">
              Optional
            </span>
          )}
          {node.xpBonus > 0 && (
            <span className="flex items-center gap-0.5 rounded-md bg-yellow-500/10 px-1.5 py-0.5 font-mono text-[8px] text-yellow-500 ring-1 ring-yellow-500/20">
              <Zap className="h-2 w-2" />+{node.xpBonus}
            </span>
          )}
        </div>
        <p className="font-mono text-[11px] text-slate-500 leading-relaxed line-clamp-2">
          {node.preNarrative?.slice(0, 80) ??
            node.content?.slice(0, 80) ??
            `Node #${node.order}`}
          {((node.preNarrative?.length ?? 0) > 80 ||
            (node.content?.length ?? 0) > 80) &&
            "…"}
        </p>
      </div>
    </div>
  );
}
