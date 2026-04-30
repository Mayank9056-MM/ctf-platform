// modules/story/utils/graph.validation.ts
// ─────────────────────────────────────────────────────────────────────────────
// Frontend mirror of chapter.validateGraph() from the Mongoose model.
// Runs on every graph change — instant, no server round-trip.
//
// Severity levels:
//   error   → blocks Publish button
//   warning → shows UI warning, allow publish with acknowledgment
//   info    → informational only (e.g. terminal nodes are fine but noted)
//
// Error codes map to specific UI messages and node highlights.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StoryGraph,
  GraphNode,
  GraphEdge,
  ValidationError,
  GraphValidation,
} from "../types/graph.types";
import type { ChoiceNodeData } from "../types/graph.types";

// ─── Rule definitions ─────────────────────────────────────────────────────────

const RULES = {
  NO_ENTRY_POINT: "NO_ENTRY_POINT",
  MULTIPLE_ENTRY_POINTS: "MULTIPLE_ENTRY_POINTS",
  CYCLE_DETECTED: "CYCLE_DETECTED",
  DANGLING_EDGE: "DANGLING_EDGE",
  CHOICE_TOO_FEW: "CHOICE_TOO_FEW",
  MISSING_CHALLENGE: "MISSING_CHALLENGE",
  MISSING_CONTENT: "MISSING_CONTENT",
  UNREACHABLE_NODE: "UNREACHABLE_NODE",
  TERMINAL_NODE: "TERMINAL_NODE",
  DUPLICATE_CHOICE_LABEL: "DUPLICATE_CHOICE_LABEL",
  EMPTY_CHOICE_LABEL: "EMPTY_CHOICE_LABEL",
  CHOICE_MISSING_TARGET: "CHOICE_MISSING_TARGET",
} as const;

// ─── Main validator ─────────────────────────────────────────────────────────────

export function validateGraph(graph: StoryGraph): GraphValidation {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.id));

  // ── Rule 1: Entry point ───────────────────────────────────────────────────

  const entryNodes = graph.nodes.filter((n) => n.isEntryPoint);

  if (entryNodes.length === 0) {
    errors.push({
      severity: "error",
      code: RULES.NO_ENTRY_POINT,
      message:
        "Chapter must have exactly one entry point node. Mark one node as Entry Point.",
    });
  } else if (entryNodes.length > 1) {
    for (const n of entryNodes) {
      errors.push({
        nodeId: n.id,
        severity: "error",
        code: RULES.MULTIPLE_ENTRY_POINTS,
        message: `Multiple entry points. Only one node can be the entry point.`,
      });
    }
  }

  // ── Rule 2: Dangling edges ────────────────────────────────────────────────

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push({
        edgeId: edge.id,
        severity: "error",
        code: RULES.DANGLING_EDGE,
        message: `Edge source node ${edge.from} does not exist.`,
      });
    }
    if (!nodeIds.has(edge.to)) {
      errors.push({
        edgeId: edge.id,
        severity: "error",
        code: RULES.DANGLING_EDGE,
        message: `Edge target node ${edge.to} does not exist.`,
      });
    }
  }

  // ── Rule 3: Per-node validations ──────────────────────────────────────────

  for (const node of graph.nodes) {
    // Challenge nodes need a challenge assigned
    if (node.type === "challenge") {
      const data = node.data as { challengeId?: string };
      if (!data.challengeId) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          code: RULES.MISSING_CHALLENGE,
          message: `Challenge node #${node.order} has no challenge assigned.`,
        });
      }
    }

    // Non-challenge nodes need content or preNarrative
    if (node.type === "cutscene" || node.type === "briefing") {
      const data = node.data as { content?: string; preNarrative?: string };
      if (!data.content && !data.preNarrative) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          code: RULES.MISSING_CONTENT,
          message: `${node.type} node #${node.order} needs content or pre-narrative text.`,
        });
      }
    }

    // Choice node rules
    if (node.type === "choice") {
      const choiceEdges = graph.edges.filter(
        (e) => e.from === node.id && e.type === "choice",
      );

      if (choiceEdges.length < 2) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          code: RULES.CHOICE_TOO_FEW,
          message: `Choice node #${node.order} needs at least 2 options (has ${choiceEdges.length}).`,
        });
      }

      // Check for empty labels and duplicates from node data
      const choiceData = (node.data as ChoiceNodeData).choices ?? [];
      const labels = choiceData.map((c) => c.label.trim()).filter(Boolean);
      const uniqueLabels = new Set(labels);

      if (labels.length < choiceData.length) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          code: RULES.EMPTY_CHOICE_LABEL,
          message: `Choice node #${node.order} has choices with empty labels.`,
        });
      }

      if (uniqueLabels.size < labels.length) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          code: RULES.DUPLICATE_CHOICE_LABEL,
          message: `Choice node #${node.order} has duplicate choice labels.`,
        });
      }

      // Check unconnected choice branches
      const unconnected = choiceData.filter((c) => !c.targetNode);
      if (unconnected.length > 0) {
        errors.push({
          nodeId: node.id,
          severity: "warning",
          code: RULES.CHOICE_MISSING_TARGET,
          message: `Choice node #${node.order} has ${unconnected.length} unconnected branch(es). Drag handles to wire them.`,
        });
      }
    }
  }

  // ── Rule 4: Cycle detection (DFS) ────────────────────────────────────────

  if (
    !errors.some(
      (e) => e.severity === "error" && e.code === RULES.DANGLING_EDGE,
    )
  ) {
    // Build forward adjacency (linear + choice edges only, not unlock)
    const adj = new Map<string, string[]>();
    for (const n of graph.nodes) adj.set(n.id, []);
    for (const e of graph.edges) {
      if (e.type === "linear" || e.type === "choice") {
        adj.get(e.from)?.push(e.to);
      }
    }

    const WHITE = 0,
      GRAY = 1,
      BLACK = 2;
    const color = new Map<string, number>();
    for (const n of graph.nodes) color.set(n.id, WHITE);

    const dfs = (id: string, path: string[]): boolean => {
      color.set(id, GRAY);
      for (const neighbor of adj.get(id) ?? []) {
        if (color.get(neighbor) === GRAY) {
          // Cycle found — report on the node that closes it
          errors.push({
            nodeId: id,
            severity: "error",
            code: RULES.CYCLE_DETECTED,
            message: `Cycle detected: ${[...path, id, neighbor]
              .map((x) => {
                const n = graph.nodes.find((n) => n.id === x);
                return n ? `#${n.order}` : x.slice(-4);
              })
              .join(" → ")}`,
          });
          return true;
        }
        if (color.get(neighbor) === WHITE) {
          if (dfs(neighbor, [...path, id])) return true;
        }
      }
      color.set(id, BLACK);
      return false;
    };

    for (const n of graph.nodes) {
      if (color.get(n.id) === WHITE) dfs(n.id, []);
    }
  }

  // ── Rule 5: Reachability from entry point ────────────────────────────────

  if (entryNodes.length === 1) {
    const entryId = entryNodes[0].id;
    const reachable = new Set<string>();

    // BFS from entry, following linear + choice edges
    const queue = [entryId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const e of graph.edges) {
        if (e.from === id && (e.type === "linear" || e.type === "choice")) {
          if (!reachable.has(e.to)) queue.push(e.to);
        }
      }
    }

    for (const node of graph.nodes) {
      if (!reachable.has(node.id) && !node.isOptional && node.id !== entryId) {
        // Check if it has unlockAfter (those are reachable via prerequisites, not traversal)
        const hasUnlockDep = graph.edges.some(
          (e) => e.to === node.id && e.type === "unlock",
        );
        if (!hasUnlockDep) {
          errors.push({
            nodeId: node.id,
            severity: "warning",
            code: RULES.UNREACHABLE_NODE,
            message: `Node #${node.order} is not reachable from the entry point. Connect it or mark as optional.`,
          });
        }
      }
    }
  }

  // ── Rule 6: Terminal node info ────────────────────────────────────────────

  for (const node of graph.nodes) {
    const hasOutgoing = graph.edges.some(
      (e) => e.from === node.id && (e.type === "linear" || e.type === "choice"),
    );
    if (!hasOutgoing) {
      errors.push({
        nodeId: node.id,
        severity: "info",
        code: RULES.TERMINAL_NODE,
        message: `Node #${node.order} is a terminal node (story branch ends here).`,
      });
    }
  }

  // ── Index errors by node ──────────────────────────────────────────────────

  const byNode: Record<string, ValidationError[]> = {};
  for (const err of errors) {
    if (err.nodeId) {
      if (!byNode[err.nodeId]) byNode[err.nodeId] = [];
      byNode[err.nodeId].push(err);
    }
  }

  return {
    isValid: !errors.some((e) => e.severity === "error"),
    errors,
    byNode,
  };
}

// ─── Helpers for UI ────────────────────────────────────────────────────────────

export function getNodeErrorCount(
  validation: GraphValidation,
  nodeId: string,
): number {
  return (
    validation.byNode[nodeId]?.filter((e) => e.severity === "error").length ?? 0
  );
}

export function getNodeWarningCount(
  validation: GraphValidation,
  nodeId: string,
): number {
  return (
    validation.byNode[nodeId]?.filter((e) => e.severity === "warning").length ??
    0
  );
}

export function getNodeValidationStatus(
  validation: GraphValidation,
  nodeId: string,
): "error" | "warning" | "valid" {
  const errs = validation.byNode[nodeId] ?? [];
  if (errs.some((e) => e.severity === "error")) return "error";
  if (errs.some((e) => e.severity === "warning")) return "warning";
  return "valid";
}
