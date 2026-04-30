"use client";
// modules/story/components/graph/GraphCanvas.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The React Flow canvas. Receives all data/callbacks from useGraphEditor.
// Intentionally a thin presentation layer — no business logic here.
//
// Sections:
//   1. React Flow instance + event wiring
//   2. Top toolbar (Add Node, Validate, Publish)
//   3. Validation overlay panel
//   4. Legend bar
//   5. Empty state
//   6. MiniMap + Controls
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  Panel, ReactFlowProvider, NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  AlertCircle, BookOpen, CheckCircle2, Eye, Loader2, Plus, X, Zap,
  Play, RotateCcw, GitBranch, Flag, Terminal, Tv,
} from "lucide-react";

import StoryNodeComponent from "./NodeComponent";
import { useAdminPublishChapter }  from "@/modules/story/hooks/admin/chapter/useAdminPublishChapter";
import { useAdminValidateChapter } from "@/modules/story/hooks/admin/chapter/useAdminValidateChapter";
import { useGraphStore }           from "@/modules/story/store/graph.store";
import type { GraphValidation }    from "@/modules/story/types/graph.types";
import type { StoryChapter }       from "@/modules/story/types/story.types";

// Register custom node types once — outside component to prevent React Flow re-renders
const nodeTypes: NodeTypes = { storyNode: StoryNodeComponent };

// ─── Props ────────────────────────────────────────────────────────────────────

interface GraphCanvasProps {
  storyId:    string;
  chapterId:  string;
  chapter:    StoryChapter | null;
  // From useGraphEditor
  rfNodes:    any[];
  rfEdges:    any[];
  onNodesChange:    (c: any[]) => void;
  onEdgesChange:    (c: any[]) => void;
  onConnect:        (c: any)   => void;
  onConnectEnd:     (e: any, s: any) => void;
  handleNodeDragStop: (e: any, n: any) => void;
  validation:       GraphValidation | null;
  setDeleteTargetId:(id: string) => void;
}

// ─── Canvas toolbar ───────────────────────────────────────────────────────────

function CanvasToolbar({
  storyId,
  chapterId,
  chapter,
  validation,
}: {
  storyId:   string;
  chapterId: string;
  chapter:   StoryChapter | null;
  validation: GraphValidation | null;
}) {
  const { openCreatePanel, openPreviewPanel, startTraversal, isTraversalActive } = useGraphStore();
  const { mutate: publish,  isPending: isPublishing  } = useAdminPublishChapter(storyId, chapterId);
  const { mutate: validate, isPending: isValidating  } = useAdminValidateChapter(storyId, chapterId);
  const [showValidation, setShowValidation] = useState(false);

  const errorCount   = validation?.errors.filter((e) => e.severity === "error").length   ?? 0;
  const warningCount = validation?.errors.filter((e) => e.severity === "warning").length ?? 0;

  return (
    <div className="space-y-2">
      {/* Primary actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => openCreatePanel()}
          className="flex items-center gap-2 rounded-xl bg-violet-500 px-3.5 py-2 font-mono text-xs font-black text-white shadow-lg shadow-violet-500/30 hover:bg-violet-400 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Node
        </button>

        <button
          onClick={() => setShowValidation((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-xs font-black transition-colors",
            errorCount > 0
              ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : warningCount > 0
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
          )}
        >
          {validation?.isValid
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <AlertCircle  className="h-3.5 w-3.5" />}
          {errorCount > 0
            ? `${errorCount} error${errorCount > 1 ? "s" : ""}`
            : warningCount > 0
            ? `${warningCount} warning${warningCount > 1 ? "s" : ""}`
            : "Graph valid"}
        </button>

        {!chapter?.isPublished && (
          <button
            onClick={() => publish(undefined)}
            disabled={isPublishing || !validation?.isValid}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 font-mono text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={!validation?.isValid ? "Fix errors before publishing" : undefined}
          >
            {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Publish
          </button>
        )}

        <button
          onClick={isTraversalActive ? () => useGraphStore.getState().stopTraversal() : startTraversal}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-xs font-black transition-colors",
            isTraversalActive
              ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-white",
          )}
        >
          {isTraversalActive ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isTraversalActive ? "Stop test" : "Play test"}
        </button>
      </div>

      {/* Validation details panel */}
      <AnimatePresence>
        {showValidation && validation && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={   { opacity: 0, y: -4, scale: 0.98  }}
            className={cn(
              "rounded-xl border font-mono text-[11px] max-w-xs shadow-2xl shadow-black/60",
              validation.isValid
                ? "border-emerald-500/25 bg-[#060a12]/95 text-emerald-400"
                : "border-red-500/25 bg-[#060a12]/95",
            )}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/60">
              {validation.isValid ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Graph is valid — safe to publish
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400 font-black">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errorCount} error{errorCount !== 1 ? "s" : ""}{warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? "s" : ""}` : ""}
                </div>
              )}
              <button onClick={() => setShowValidation(false)} className="text-slate-600 hover:text-slate-300 ml-3">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {validation.errors.filter((e) => e.severity !== "info").map((err, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-2 px-2.5 py-1.5 rounded-lg",
                  err.severity === "error"   ? "text-red-400"   : "text-amber-400",
                )}>
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed">{err.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node type legend */}
      <div className="flex items-center gap-3 rounded-xl bg-[#060c18]/80 border border-slate-800/60 px-3 py-2 backdrop-blur-sm">
        {([
          ["challenge", "#f87171", Flag],
          ["cutscene",  "#a78bfa", Tv],
          ["briefing",  "#38bdf8", Terminal],
          ["choice",    "#fbbf24", GitBranch],
        ] as const).map(([type, color, Icon]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="font-mono text-[9px] text-slate-500 capitalize">{type}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-4 rounded-full bg-slate-600/60" style={{ backgroundImage: "repeating-linear-gradient(90deg, #475569 0 4px, transparent 4px 7px)" }} />
          <span className="font-mono text-[9px] text-slate-600">unlock</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

function GraphCanvasInner(props: GraphCanvasProps) {
  const {
    storyId, chapterId, chapter,
    rfNodes, rfEdges,
    onNodesChange, onEdgesChange, onConnect, onConnectEnd, handleNodeDragStop,
    validation, setDeleteTargetId,
  } = props;

  const hasNodes = rfNodes.length > 0;

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={handleNodeDragStop}
        onNodesDelete={(deleted) => deleted[0] && setDeleteTargetId(deleted[0].id)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, minZoom: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        selectionOnDrag={true}
        deleteKeyCode="Delete"
        style={{ background: "transparent" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />

        <Controls
          position="bottom-left"
          className={cn(
            "[&>button]:bg-slate-900/80 [&>button]:border-slate-700/60",
            "[&>button]:text-slate-400 [&>button:hover]:bg-slate-800 [&>button:hover]:text-white",
          )}
        />

        <MiniMap
          nodeColor={(n) => {
            const type = (n.data as any)?.node?.type;
            const colors: Record<string, string> = {
              challenge: "#f87171", cutscene: "#a78bfa",
              briefing:  "#38bdf8", choice:   "#fbbf24",
            };
            return colors[type] ?? "#334155";
          }}
          maskColor="rgba(6,10,18,0.75)"
          style={{
            background:   "#0a0e15",
            border:       "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
          }}
        />

        {/* Top-left toolbar */}
        <Panel position="top-left">
          <CanvasToolbar
            storyId={storyId}
            chapterId={chapterId}
            chapter={chapter}
            validation={validation}
          />
        </Panel>

        {/* Empty state */}
        {!hasNodes && (
          <Panel position="top-center">
            <div
              className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700/60 bg-[#060c18]/80 px-10 py-8 backdrop-blur-sm text-center"
            >
              <BookOpen className="h-10 w-10 text-slate-700" />
              <div>
                <p className="font-mono text-sm font-black text-slate-500">No nodes yet</p>
                <p className="font-mono text-xs text-slate-700 mt-1 max-w-[220px]">
                  Click <span className="text-violet-400 font-bold">Add Node</span> to create the entry point.
                  Then drag handles to wire the graph.
                </p>
              </div>
              <button
                onClick={() => useGraphStore.getState().openCreatePanel()}
                className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 font-mono text-xs font-black text-white hover:bg-violet-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Entry Node
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// Wrap in provider — must be done per-canvas, not at app level
export default function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}