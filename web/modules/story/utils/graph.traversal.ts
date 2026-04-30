// modules/story/utils/graph.traversal.ts
// ─────────────────────────────────────────────────────────────────────────────
// Client-side story traversal engine for admin play-test mode.
// Mirrors the logic in story.service.ts / _commitNodeCompletion but runs
// entirely in the browser — no server calls, no real progress saved.
//
// Used in: StoryPreviewPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StoryGraph,
  GraphNode,
  TraversalState,
  TraversalEvent,
} from "../types/graph.types";

export class StoryTraversal {
  private graph: StoryGraph;
  private state: TraversalState;

  constructor(graph: StoryGraph) {
    this.graph = graph;
    const entryNode = graph.nodes.find((n) => n.isEntryPoint);

    this.state = {
      currentNodeId: entryNode?.id ?? "",
      completedIds:  new Set(),
      bypassedIds:   new Set(),
      path:          entryNode ? [entryNode.id] : [],
      choicesMade:   [],
    };
  }

  // ─── Current node ─────────────────────────────────────────────────────────

  getCurrentNode(): GraphNode | null {
    return this.graph.nodes.find((n) => n.id === this.state.currentNodeId) ?? null;
  }

  getState(): Readonly<TraversalState> {
    return { ...this.state, completedIds: new Set(this.state.completedIds), bypassedIds: new Set(this.state.bypassedIds) };
  }

  isNodeCompleted(id: string): boolean { return this.state.completedIds.has(id); }
  isNodeBypassed(id:  string): boolean { return this.state.bypassedIds.has(id);  }
  isNodeCurrent(id:   string): boolean { return this.state.currentNodeId === id;  }

  // ─── Advance ──────────────────────────────────────────────────────────────
  // Completes current node and moves to next (for linear/cutscene/briefing/challenge)

  advance(): TraversalEvent {
    const current = this.getCurrentNode();
    if (!current) return { type: "error", message: "No current node" };

    if (current.type === "choice") {
      const choiceEdges = this.graph.edges.filter(
        (e) => e.from === current.id && e.type === "choice"
      );
      return {
        type:    "choice",
        choices: choiceEdges.map((e) => ({ label: e.label ?? "", edgeId: e.id })),
      };
    }

    // Mark completed
    this.state.completedIds.add(current.id);

    // Find next
    const nextEdge = this.graph.edges.find(
      (e) => e.from === current.id && e.type === "linear"
    );

    if (!nextEdge) {
      return this.checkCompletion();
    }

    const nextNode = this.graph.nodes.find((n) => n.id === nextEdge.to);
    if (!nextNode) return { type: "error", message: `Next node ${nextEdge.to} not found` };

    // Check unlock prerequisites
    const unlockEdges = this.graph.edges.filter(
      (e) => e.to === nextNode.id && e.type === "unlock"
    );
    const allPrereqsMet = unlockEdges.every((e) => this.state.completedIds.has(e.from));

    if (!allPrereqsMet) {
      return {
        type:    "error",
        message: `Node #${nextNode.order} is locked — complete prerequisite nodes first.`,
      };
    }

    this.state.currentNodeId = nextNode.id;
    this.state.path.push(nextNode.id);
    return { type: "advance", nextNodeId: nextNode.id };
  }

  // ─── Make choice ──────────────────────────────────────────────────────────

  makeChoice(edgeId: string): TraversalEvent {
    const current = this.getCurrentNode();
    if (!current || current.type !== "choice") {
      return { type: "error", message: "Current node is not a choice node" };
    }

    const chosenEdge = this.graph.edges.find((e) => e.id === edgeId);
    if (!chosenEdge) return { type: "error", message: "Invalid choice" };

    // Mark current node completed
    this.state.completedIds.add(current.id);

    // Compute bypassed nodes (unchosen branches)
    const allChoiceEdges = this.graph.edges.filter(
      (e) => e.from === current.id && e.type === "choice"
    );
    const unchosenEdges = allChoiceEdges.filter((e) => e.id !== edgeId);

    const chosenReachable = this.collectReachable(chosenEdge.to);

    for (const unchosen of unchosenEdges) {
      const unchosenReachable = this.collectReachable(unchosen.to);
      for (const id of unchosenReachable) {
        if (!chosenReachable.has(id)) {
          this.state.bypassedIds.add(id);
        }
      }
    }

    // Record choice
    this.state.choicesMade.push({
      nodeId:      current.id,
      choiceLabel: chosenEdge.label ?? "",
      toNodeId:    chosenEdge.to,
    });

    // Move to target
    const targetNode = this.graph.nodes.find((n) => n.id === chosenEdge.to);
    if (!targetNode) return { type: "error", message: "Target node not found" };

    this.state.currentNodeId = targetNode.id;
    this.state.path.push(targetNode.id);
    return { type: "advance", nextNodeId: targetNode.id };
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  reset(): void {
    const entry = this.graph.nodes.find((n) => n.isEntryPoint);
    this.state = {
      currentNodeId: entry?.id ?? "",
      completedIds:  new Set(),
      bypassedIds:   new Set(),
      path:          entry ? [entry.id] : [],
      choicesMade:   [],
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private collectReachable(startId: string): Set<string> {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      for (const e of this.graph.edges) {
        if (e.from === id && (e.type === "linear" || e.type === "choice")) {
          if (!visited.has(e.to)) queue.push(e.to);
        }
      }
    }
    return visited;
  }

  private checkCompletion(): TraversalEvent {
    const allRequired = this.graph.nodes.filter((n) => !n.isOptional && !this.state.bypassedIds.has(n.id));
    const allDone = allRequired.every((n) => this.state.completedIds.has(n.id));
    return allDone ? { type: "complete" } : { type: "terminal" };
  }
}