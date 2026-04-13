import { cn } from "@/lib/utils";
import { NODE_TYPE_CONFIG } from "@/modules/story/config/admin-editor-ui.config";
import { StoryNode } from "@/modules/story/types/story.types";
import { useState } from "react";
import { NodeTypeBadge } from "./NodeTypeBadge";
import {
  ChevronDown,
  ChevronRight,
  Flag,
  GitBranch,
  Shield,
  Trash2,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";

export function NodeCard({
  node,
  chapterId,
  storyId,
  onDelete,
}: {
  node: StoryNode;
  chapterId: string;
  storyId: string;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = NODE_TYPE_CONFIG[node.type];

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        expanded
          ? "border-slate-700 bg-slate-900/60"
          : "border-slate-800/60 bg-slate-900/30 hover:border-slate-700/60",
      )}
    >
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Order badge */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 text-[11px] font-bold font-mono",
            cfg.bg,
            cfg.color,
            cfg.ring,
          )}
        >
          {node.order}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <NodeTypeBadge type={node.type} />
            {node.isEntryPoint && (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400 ring-1 ring-emerald-500/20">
                entry
              </span>
            )}
            {node.isOptional && (
              <span className="rounded-full bg-slate-700/40 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                optional
              </span>
            )}
            {node.xpBonus > 0 && (
              <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-400">
                +{node.xpBonus} XP
              </span>
            )}
          </div>
          {(node.preNarrative || node.content) && (
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {(node.preNarrative || node.content)?.slice(0, 70)}...
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-600 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-slate-800/60 pt-2.5">
              {/* Node details */}
              {node.challengeId && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Flag className="h-3 w-3 text-red-400 shrink-0" />
                  <span className="text-slate-500 font-mono">Challenge:</span>
                  <span className="text-slate-300 font-mono truncate">
                    {node.challengeId}
                  </span>
                </div>
              )}
              {node.preNarrative && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-2">
                  <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                    Pre-narrative
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-4">
                    {node.preNarrative}
                  </p>
                </div>
              )}
              {node.content && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-2">
                  <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                    Content
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-4">
                    {node.content}
                  </p>
                </div>
              )}
              {node.choices && node.choices.length > 0 && (
                <div className="space-y-1">
                  <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
                    Choices ({node.choices.length})
                  </p>
                  {node.choices.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-violet-500/10 bg-violet-500/5 px-2.5 py-1.5"
                    >
                      <GitBranch className="h-3 w-3 text-violet-400 shrink-0" />
                      <p className="text-[11px] text-slate-300 truncate">
                        {c.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {node.nextNode && (
                <div className="flex items-center gap-2 text-[11px]">
                  <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
                  <span className="text-slate-500 font-mono">Next:</span>
                  <span className="text-slate-300 font-mono truncate">
                    {node.nextNode}
                  </span>
                </div>
              )}
              {node.unlockAfter?.length > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Shield className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="text-slate-500 font-mono">
                    Unlocks after {node.unlockAfter.length} node(s)
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
