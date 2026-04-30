"use client";
// modules/story/components/graph/NodeComponent.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Custom React Flow node. Renders a story node on the canvas with:
//   - Type-colored border + icon
//   - Content preview (narrative preview, challenge ID, choice branches)
//   - Validation indicator (red ring on error, yellow on warning)
//   - Entry point star badge
//   - Source / target handles
//   - Per-choice source handles for choice nodes (spread along bottom edge)
//   - Selection ring
//
// Design decisions:
//   - Fixed 220px width — React Flow needs stable node dimensions for layout
//   - No overflow — everything clips with line-clamp
//   - Handles are 10px, styled to match node type color
// ─────────────────────────────────────────────────────────────────────────────

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import {
  AlertCircle, Flag, GitBranch, Star, Terminal, Tv, Zap,
} from "lucide-react";
import type { GraphNode, ValidationError } from "@/modules/story/types/graph.types";
import type { ChoiceNodeData } from "@/modules/story/types/graph.types";

// ─── Node config ──────────────────────────────────────────────────────────────

const NODE_CFG = {
  challenge: {
    label:       "Challenge",
    Icon:        Flag,
    color:       "#f87171",
    bg:          "rgba(239,68,68,0.12)",
    border:      "rgba(239,68,68,0.35)",
    glow:        "rgba(239,68,68,0.20)",
    handleColor: "#f87171",
  },
  cutscene: {
    label:       "Cutscene",
    Icon:        Tv,
    color:       "#a78bfa",
    bg:          "rgba(139,92,246,0.12)",
    border:      "rgba(139,92,246,0.35)",
    glow:        "rgba(139,92,246,0.20)",
    handleColor: "#a78bfa",
  },
  briefing: {
    label:       "Briefing",
    Icon:        Terminal,
    color:       "#38bdf8",
    bg:          "rgba(56,189,248,0.12)",
    border:      "rgba(56,189,248,0.35)",
    glow:        "rgba(56,189,248,0.20)",
    handleColor: "#38bdf8",
  },
  choice: {
    label:       "Choice",
    Icon:        GitBranch,
    color:       "#fbbf24",
    bg:          "rgba(251,191,36,0.12)",
    border:      "rgba(251,191,36,0.35)",
    glow:        "rgba(251,191,36,0.20)",
    handleColor: "#fbbf24",
  },
} as const;

const BRANCH_COLORS = ["#34d399","#60a5fa","#f472b6","#fb923c","#a78bfa","#4ade80"];

// ─── Handle styles ────────────────────────────────────────────────────────────

const baseHandle = (color: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  background:  color,
  border:      "2.5px solid #060a12",
  width:       12,
  height:      12,
  borderRadius: 6,
  ...extra,
});

// ─── NodeData passed from useGraphEditor ──────────────────────────────────────

export interface StoryNodeData {
  node:        GraphNode;
  validErrors: ValidationError[];
  isSelected:  boolean;
  onSelect:    (id: string) => void;
  // Traversal state (play-test mode)
  isCurrentTraversal?: boolean;
  isCompletedTraversal?: boolean;
  isBypassedTraversal?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

function StoryNodeComponent({ data }: NodeProps<StoryNodeData>) {
  const {
    node,
    validErrors,
    isSelected,
    onSelect,
    isCurrentTraversal,
    isCompletedTraversal,
    isBypassedTraversal,
  } = data;

  const cfg = NODE_CFG[node.type];
  const Icon = cfg.Icon;

  const hasError   = validErrors.some((e) => e.severity === "error");
  const hasWarning = validErrors.some((e) => e.severity === "warning");
  const errorCount = validErrors.filter((e) => e.severity === "error").length;

  // Choose border color based on state priority
  const borderColor = (() => {
    if (isCurrentTraversal)   return "#34d399";
    if (hasError)             return "rgba(239,68,68,0.80)";
    if (hasWarning)           return "rgba(251,191,36,0.60)";
    if (isSelected)           return cfg.color;
    if (isCompletedTraversal) return "#22c55e40";
    return cfg.border;
  })();

  const boxShadow = (() => {
    if (isCurrentTraversal) return `0 0 0 2px #34d39930, 0 0 20px #34d39930, 0 4px 20px rgba(0,0,0,0.4)`;
    if (hasError)           return `0 0 0 2px rgba(239,68,68,0.3)`;
    if (isSelected)         return `0 0 0 2px ${cfg.glow}, 0 4px 20px ${cfg.glow}`;
    return "0 2px 12px rgba(0,0,0,0.4)";
  })();

  const choiceData = node.type === "choice"
    ? (node.data as ChoiceNodeData).choices ?? []
    : [];

  const challengeId  = (node.data).challengeId;
  const content      = (node.data).content;
  const preNarrative = (node.data).preNarrative;

  return (
    <div
      onClick={() => onSelect(node.id)}
      className={cn(
        "relative cursor-pointer rounded-2xl select-none transition-all duration-150",
        isBypassedTraversal && "opacity-30",
      )}
      style={{
        width:      220,
        background: isSelected ? cfg.bg.replace("0.12", "0.20") : cfg.bg,
        border:     `1.5px solid ${borderColor}`,
        boxShadow,
      }}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={baseHandle(cfg.handleColor, { top: -6 })}
      />

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>
              {cfg.label}
            </p>
            <p className="font-mono text-[9px] text-slate-600">#{node.order}</p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {node.xpBonus > 0 && (
              <span className="flex items-center gap-0.5 font-mono text-[8px] text-amber-400">
                <Zap className="h-2 w-2" />{node.xpBonus}
              </span>
            )}
            {node.isEntryPoint && (
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)" }}
                title="Entry point"
              >
                <Star className="h-2.5 w-2.5" style={{ color: "#34d399" }} />
              </span>
            )}
            {hasError && (
              <span
                className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[8px] font-bold"
                style={{ background: "rgba(239,68,68,0.20)", border: "1px solid rgba(239,68,68,0.40)", color: "#f87171" }}
                title={validErrors.filter((e) => e.severity === "error").map((e) => e.message).join("\n")}
              >
                <AlertCircle className="h-2.5 w-2.5 mr-0.5 shrink-0" />{errorCount}
              </span>
            )}
            {!hasError && hasWarning && (
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: "rgba(251,191,36,0.20)", border: "1px solid rgba(251,191,36,0.40)" }}
              >
                <AlertCircle className="h-2.5 w-2.5" style={{ color: "#fbbf24" }} />
              </span>
            )}
          </div>
        </div>

        {/* Content preview */}
        {node.type === "challenge" && challengeId && (
          <p className="font-mono text-[9px] truncate" style={{ color: "rgba(248,113,113,0.70)" }}>
            ⚑ {challengeId.slice(-10)}
          </p>
        )}

        {(node.type === "cutscene" || node.type === "briefing") && (content || preNarrative) && (
          <p className="font-mono text-[9px] text-slate-500 italic line-clamp-2">
            &quot;{(content || preNarrative)?.slice(0, 60)}{(content || preNarrative)?.length > 60 ? "…" : ""}&quot;
          </p>
        )}

        {node.type === "choice" && choiceData.length > 0 && (
          <div className="space-y-0.5">
            {choiceData.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                <span className="font-mono text-[9px] text-slate-400 truncate">{c.label || `Branch ${String.fromCharCode(65+i)}`}</span>
              </div>
            ))}
            {choiceData.length > 3 && (
              <p className="font-mono text-[8px] text-slate-600">+{choiceData.length - 3} more</p>
            )}
          </div>
        )}

        {/* Error summary */}
        {hasError && (
          <div
            className="rounded-lg px-2 py-1"
            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}
          >
            <p className="font-mono text-[9px] line-clamp-2" style={{ color: "#f87171" }}>
              {validErrors.find((e) => e.severity === "error")?.message}
            </p>
          </div>
        )}
      </div>

      {/* Traversal current ring */}
      {isCurrentTraversal && (
        <div
          className="absolute -inset-[3px] rounded-[18px] pointer-events-none animate-pulse"
          style={{ border: "2px solid #34d399", opacity: 0.6 }}
        />
      )}

      {/* Source handle — linear nodes: one handle at bottom */}
      {node.type !== "choice" && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={baseHandle(cfg.handleColor, { bottom: -6 })}
        />
      )}

      {/* Source handles — choice nodes: one per choice, spread across bottom */}
      {node.type === "choice" && choiceData.map((_, i) => {
        const total = Math.max(choiceData.length, 1);
        const pct   = total === 1 ? 50 : (i / (total - 1)) * 80 + 10;
        const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
        return (
          <Handle
            key={i}
            id={`choice-${i}`}
            type="source"
            position={Position.Bottom}
            style={baseHandle(color, {
              bottom:    -5,
              left:      `${pct}%`,
              transform: "translateX(-50%)",
              width:     10,
              height:    10,
            })}
          />
        );
      })}
    </div>
  );
}

export default memo(StoryNodeComponent);