"use client";
// modules/story/components/editor/PlayTestPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin play-test panel. Uses StoryTraversal to simulate walking through
// the chapter graph in the browser — no server calls, no real progress.
//
// The panel highlights the current node on the canvas via the graph store.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2, ChevronRight, Flag, GitBranch, RotateCcw,
  StopCircle, Terminal, Trophy, Tv, X, Zap,
} from "lucide-react";

import { useGraphStore } from "@/modules/story/store/graph.store";
import { StoryTraversal } from "@/modules/story/utils/graph.traversal";
import type { StoryGraph, GraphNode, TraversalEvent } from "@/modules/story/types/graph.types";

const NODE_CFG = {
  challenge: { Icon: Flag,      color: "#f87171", label: "Challenge" },
  cutscene:  { Icon: Tv,        color: "#a78bfa", label: "Cutscene"  },
  briefing:  { Icon: Terminal,  color: "#38bdf8", label: "Briefing"  },
  choice:    { Icon: GitBranch, color: "#fbbf24", label: "Choice"    },
} as const;

interface PlayTestPanelProps {
  graph: StoryGraph;
}

export default function PlayTestPanel({ graph }: PlayTestPanelProps) {
  const { stopTraversal } = useGraphStore();

  const traversal = useMemo(() => new StoryTraversal(graph), [graph]);
  const [state, setState] = useState(() => traversal.getState());
  const [lastEvent, setLastEvent] = useState<TraversalEvent | null>(null);
  const [log, setLog] = useState<{ nodeId: string; label: string; type: string }[]>([]);

  const currentNode = graph.nodes.find((n) => n.id === state.currentNodeId) ?? null;
  const isComplete  = lastEvent?.type === "complete" || lastEvent?.type === "terminal";

  const handleAdvance = () => {
    const event = traversal.advance();
    setState(traversal.getState());
    setLastEvent(event);
    if (currentNode) {
      setLog((prev) => [...prev, { nodeId: currentNode.id, label: `#${currentNode.order} ${NODE_CFG[currentNode.type].label}`, type: currentNode.type }]);
    }
  };

  const handleChoice = (edgeId: string, label: string) => {
    const event = traversal.makeChoice(edgeId);
    setState(traversal.getState());
    setLastEvent(event);
    if (currentNode) {
      setLog((prev) => [...prev, {
        nodeId: currentNode.id,
        label:  `#${currentNode.order} → "${label}"`,
        type:   currentNode.type,
      }]);
    }
  };

  const handleReset = () => {
    traversal.reset();
    setState(traversal.getState());
    setLastEvent(null);
    setLog([]);
  };

  if (!currentNode && !isComplete) {
    return (
      <div className="flex flex-col h-full bg-[#060a12] items-center justify-center gap-4">
        <p className="font-mono text-sm text-red-400">No entry point node found.</p>
        <button onClick={stopTraversal} className="font-mono text-xs text-slate-500 hover:text-slate-300 underline">
          Close
        </button>
      </div>
    );
  }

  const cfg = currentNode ? NODE_CFG[currentNode.type] : null;

  // Get choices from graph if current is a choice node
  const choiceEdges = currentNode?.type === "choice"
    ? graph.edges.filter((e) => e.from === currentNode.id && e.type === "choice")
    : [];

  return (
    <div className="flex flex-col h-full bg-[#060a12]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-800/60 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <Flag className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-mono text-sm font-black text-white">Play Test</p>
            <p className="font-mono text-[10px] text-slate-500">
              {state.completedIds.size} completed · {state.bypassedIds.size} bypassed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-7 rounded-lg border border-slate-700/60 bg-slate-900/40 px-2.5 font-mono text-[10px] text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />Reset
          </button>
          <button
            onClick={stopTraversal}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Completion state */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "rounded-2xl border p-5 text-center space-y-3",
              lastEvent?.type === "complete"
                ? "border-emerald-500/25 bg-emerald-500/5"
                : "border-slate-700/60 bg-slate-900/20",
            )}
          >
            {lastEvent?.type === "complete" ? (
              <>
                <Trophy className="h-8 w-8 text-amber-400 mx-auto" />
                <p className="font-mono text-sm font-black text-white">Story Complete!</p>
                <p className="font-mono text-xs text-slate-500">All required nodes completed.</p>
              </>
            ) : (
              <>
                <StopCircle className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="font-mono text-sm font-black text-slate-400">Terminal Node</p>
                <p className="font-mono text-xs text-slate-600">This path ends here.</p>
              </>
            )}
            <button onClick={handleReset}
              className="mx-auto flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-mono text-xs font-black text-slate-950 hover:bg-emerald-400 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />Restart
            </button>
          </motion.div>
        )}

        {/* Current node card */}
        {!isComplete && currentNode && cfg && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNode.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -8 }}
              className="rounded-2xl border p-4 space-y-3"
              style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}08` }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}35` }}>
                  <cfg.Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="font-mono text-xs font-black" style={{ color: cfg.color }}>
                    #{currentNode.order} {cfg.label}
                  </p>
                  {currentNode.isEntryPoint && (
                    <p className="font-mono text-[9px] text-emerald-400">Entry point</p>
                  )}
                </div>
                {currentNode.xpBonus > 0 && (
                  <span className="ml-auto flex items-center gap-0.5 font-mono text-[10px] text-amber-400">
                    <Zap className="h-3 w-3" />+{currentNode.xpBonus} XP
                  </span>
                )}
              </div>

              {/* Node content preview */}
              {(() => {
                const d = currentNode.data;
                return (
                  <>
                    {d.preNarrative && (
                      <p className="font-mono text-xs text-slate-400 leading-relaxed italic">
                        &quot;{d.preNarrative}&quot;
                      </p>
                    )}
                    {(d.content) && (
                      <p className="font-mono text-xs text-slate-300 leading-relaxed">
                        {d.content}
                      </p>
                    )}
                    {currentNode.type === "challenge" && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                        <p className="font-mono text-[10px] text-red-400">
                          ⚑ Challenge node — in real play, player submits a flag here.
                        </p>
                        <p className="font-mono text-[9px] text-slate-600 mt-1">
                          ID: {d.challengeId ? `…${d.challengeId.slice(-10)}` : "not assigned"}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Error state */}
        {lastEvent?.type === "error" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <p className="font-mono text-xs text-red-400">{lastEvent.message}</p>
          </div>
        )}

        {/* Choice buttons or advance button */}
        {!isComplete && currentNode && (
          <div className="space-y-2">
            {choiceEdges.length > 0 ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">Make a choice:</p>
                {choiceEdges.map((edge, i) => {
                  const targetNode = graph.nodes.find((n) => n.id === edge.to);
                  const color = ["#34d399","#60a5fa","#f472b6","#fb923c","#a78bfa"][i % 5];
                  return (
                    <button key={edge.id}
                      onClick={() => handleChoice(edge.id, edge.label ?? "")}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all hover:brightness-110"
                      style={{ borderColor: `${color}40`, background: `${color}08` }}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                        <div>
                          <p className="font-mono text-xs font-bold" style={{ color }}>{edge.label}</p>
                          {targetNode && (
                            <p className="font-mono text-[9px] text-slate-600">
                              → #{targetNode.order} {NODE_CFG[targetNode.type].label}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0" style={{ color }} />
                    </button>
                  );
                })}
              </>
            ) : (
              <button onClick={handleAdvance}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 font-mono text-xs font-black text-slate-200 hover:bg-slate-700 transition-colors">
                <ChevronRight className="h-4 w-4" />
                {currentNode.type === "challenge" ? "Simulate solve →" : "Advance →"}
              </button>
            )}
          </div>
        )}

        {/* Path log */}
        {log.length > 0 && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">Path taken</p>
            <div className="space-y-1">
              {log.map((entry, i) => {
                const c = NODE_CFG[entry.type as keyof typeof NODE_CFG];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full" style={{ background: c.color }} />
                    <span className="font-mono text-[10px]" style={{ color: c.color }}>{entry.label}</span>
                    {i === log.length - 1 && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}