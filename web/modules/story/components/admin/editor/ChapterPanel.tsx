import { cn } from "@/lib/utils";
import { useAdminPublishChapter } from "@/modules/story/hooks/admin/chapter/useAdminPublishChapter";
import { useAdminValidateChapter } from "@/modules/story/hooks/admin/chapter/useAdminValidateChapter";
import { useAdminDeleteNode } from "@/modules/story/hooks/admin/node/useAdminDeleteNode";
import { StoryChapter } from "@/modules/story/types/story.types";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { AddNodeForm } from "./AddNodeForm";
import { NodeCard } from "./NodeCard";
import { motion } from "motion/react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

export function ChapterPanel({
  chapter,
  storyId,
  onDelete,
}: {
  chapter: StoryChapter;
  storyId: string;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingNode, setAddingNode] = useState(false);
  const [deleteNodeTarget, setDeleteNodeTarget] = useState<string | null>(null);

  const { mutate: publishChapter, isPending: isPublishing } =
    useAdminPublishChapter(storyId, chapter._id);
  const { mutate: validateChapter, isPending: isValidating } =
    useAdminValidateChapter(storyId, chapter._id);
  const { mutate: deleteNode, isPending: isDeletingNode } = useAdminDeleteNode(
    storyId,
    chapter._id,
  );

  const nodesSorted = [...(chapter.nodes ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const hasEntryPoint = nodesSorted.some((n) => n.isEntryPoint);
  const isPublished = chapter.isPublished;

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        expanded
          ? "border-slate-700 bg-slate-900/40"
          : "border-slate-800 bg-slate-900/20 hover:border-slate-700/60",
      )}
    >
      {/* Chapter header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Order */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ring-1 transition-all",
            isPublished
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
              : "bg-slate-800/60 text-slate-500 ring-slate-700/50",
          )}
        >
          {chapter.order}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-sm truncate">
              {chapter.title}
            </p>
            {isPublished ? (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
                published
              </span>
            ) : (
              <span className="rounded-full bg-slate-700/40 px-1.5 py-0.5 font-mono text-[9px] text-slate-500 shrink-0">
                draft
              </span>
            )}
            {!hasEntryPoint && nodesSorted.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] text-red-400 ring-1 ring-red-500/20 shrink-0">
                <AlertCircle className="h-2.5 w-2.5" />
                no entry
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="font-mono text-[11px] text-slate-500">
              {nodesSorted.length} nodes
            </span>
            {chapter.estimatedMinutes && (
              <span className="font-mono text-[11px] text-slate-600">
                {chapter.estimatedMinutes}min
              </span>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!isPublished && (
            <button
              onClick={() =>
                validateChapter({
                  storyId,
                  chapterId: chapter._id,
                })
              }
              disabled={isValidating}
              className="flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-mono text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-60"
            >
              {isValidating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Validate
            </button>
          )}
          {!isPublished && (
            <button
              onClick={() => publishChapter(undefined)}
              disabled={isPublishing}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
            >
              {isPublishing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              Publish
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-slate-600 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-600 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Chapter content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-800/60 px-4 pt-4 pb-4 space-y-3">
              {/* Narratives */}
              {(chapter.openingNarrative || chapter.closingNarrative) && (
                <div className="grid grid-cols-2 gap-2">
                  {chapter.openingNarrative && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2.5 py-2">
                      <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                        Opening
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {chapter.openingNarrative}
                      </p>
                    </div>
                  )}
                  {chapter.closingNarrative && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2.5 py-2">
                      <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                        Closing
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {chapter.closingNarrative}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Node graph header */}
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
                  Node Graph ({nodesSorted.length})
                </p>
                <button
                  onClick={() => setAddingNode((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[10px] transition-all",
                    addingNode
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                  )}
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add Node
                </button>
              </div>

              {/* Add node form */}
              <AnimatePresence>
                {addingNode && (
                  <AddNodeForm
                    chapterId={chapter._id}
                    storyId={storyId}
                    onDone={() => setAddingNode(false)}
                  />
                )}
              </AnimatePresence>

              {/* Nodes */}
              <div className="space-y-2">
                {nodesSorted.length === 0 && !addingNode && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-slate-800">
                    <Layers className="h-6 w-6 text-slate-700" />
                    <p className="font-mono text-[11px] text-slate-600">
                      No nodes yet — add the first one
                    </p>
                  </div>
                )}
                {nodesSorted.map((node) => (
                  <NodeCard
                    key={node._id}
                    node={node}
                    chapterId={chapter._id}
                    storyId={storyId}
                    onDelete={() => setDeleteNodeTarget(node._id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete node confirm */}
      <ConfirmModal
        open={!!deleteNodeTarget}
        onClose={() => setDeleteNodeTarget(null)}
        onConfirm={() =>
          deleteNodeTarget &&
          deleteNode(deleteNodeTarget, {
            onSuccess: () => setDeleteNodeTarget(null),
          })
        }
        title="Delete node?"
        description="This removes the node from the chapter graph. Connected edges will break."
        confirmLabel="Delete"
        variant="danger"
        isPending={isDeletingNode}
      />
    </div>
  );
}
