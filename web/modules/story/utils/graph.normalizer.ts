// modules/story/utils/graph.normalizer.ts
// ─────────────────────────────────────────────────────────────────────────────
// Bidirectional conversion between:
//   Backend: StoryChapter with embedded StoryNode[] (nextNode, choices, unlockAfter)
//   Frontend: StoryGraph with GraphNode[] + GraphEdge[]
//
// WHY this matters:
//   The backend embeds everything in the StoryNode subdocument. That's fine
//   for storage (MongoDB subdocs, atomic updates), but terrible for a graph
//   editor which needs to reason about edges independently of nodes.
//
//   By normalizing on the way in and denormalizing on the way out, the entire
//   graph editor (React Flow, validation, traversal) operates on ONE model.
// ─────────────────────────────────────────────────────────────────────────────

import type { StoryChapter, StoryNode } from "../types/story.types";
import type {
  GraphNode,
  GraphEdge,
  StoryGraph,
  NodeData,
  ChallengeNodeData,
  ChoiceNodeData,
} from "../types/graph.types";

// ─── Auto-layout (used when positions are missing) ────────────────────────────
// Topological sort → assign Y by depth, spread X within each depth level.
// No external dependency — dagre is recommended for production but this works.

function autoLayout(nodes: StoryNode[]): Record<string, { x: number; y: number }> {
  const HGAP = 280;
  const VGAP = 180;

  // Build adjacency for layout traversal
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const n of nodes) {
    const id = n._id;
    adj.set(id, []);
    inDegree.set(id, inDegree.get(id) ?? 0);

    if (n.nextNode) {
      adj.get(id)!.push(n.nextNode);
      inDegree.set(n.nextNode, (inDegree.get(n.nextNode) ?? 0) + 1);
    }
    for (const c of n.choices ?? []) {
      if (c.targetNode) {
        adj.get(id)!.push(c.targetNode);
        inDegree.set(c.targetNode, (inDegree.get(c.targetNode) ?? 0) + 1);
      }
    }
  }

  // BFS level assignment (topological)
  const levels = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const level = levels.get(id) ?? 0;

    for (const neighbor of adj.get(id) ?? []) {
      levels.set(neighbor, Math.max(levels.get(neighbor) ?? 0, level + 1));
      inDegree.set(neighbor, (inDegree.get(neighbor) ?? 1) - 1);
      if ((inDegree.get(neighbor) ?? 0) === 0) queue.push(neighbor);
    }
  }

  // Group nodes by level, assign positions
  const byLevel = new Map<number, string[]>();
  for (const n of nodes) {
    const level = levels.get(n._id) ?? 0;
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level)!.push(n._id);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  for (const [level, ids] of byLevel) {
    const totalWidth = (ids.length - 1) * HGAP;
    ids.forEach((id, i) => {
      positions[id] = {
        x: i * HGAP - totalWidth / 2,
        y: level * VGAP,
      };
    });
  }

  return positions;
}

// ─── Extract type-specific node data ─────────────────────────────────────────

function extractNodeData(node: StoryNode): NodeData {
  const shared = {
    preNarrative:  node.preNarrative,
    postNarrative: node.postNarrative,
    characterId:   node.characterId,
  };

  switch (node.type) {
    case "challenge":
      return { ...shared, challengeId: node.challengeId ?? "" } satisfies ChallengeNodeData;
    case "cutscene":
    case "briefing":
      return { ...shared, content: node.content ?? "" };
    case "choice":
      return {
        ...shared,
        choices: node.choices?.map((c) => ({
          label:       c.label,
          description: c.description,
          targetNode:  c.targetNode,
        })) ?? [],
      } satisfies ChoiceNodeData;
  }
}

// ─── Normalize: Chapter → StoryGraph ─────────────────────────────────────────

export function normalizeChapterToGraph(
  chapter: StoryChapter,
  storyId: string,
  savedPositions?: Record<string, { x: number; y: number }>,
): StoryGraph {
  const nodes = [...(chapter.nodes ?? [])].sort((a, b) => a.order - b.order);
  const positions = savedPositions ?? autoLayout(nodes);

  const graphNodes: GraphNode[] = nodes.map((n) => ({
    id:           n._id,
    type:         n.type,
    order:        n.order,
    isEntryPoint: n.isEntryPoint,
    isOptional:   n.isOptional,
    xpBonus:      n.xpBonus ?? 0,
    data:         extractNodeData(n),
    position:     positions[n._id] ?? { x: 0, y: 0 },
  }));

  const edges: GraphEdge[] = [];

  for (const n of nodes) {
    // Linear edge
    if (n.nextNode) {
      edges.push({
        id:   `${n._id}-linear`,
        from: n._id,
        to:   n.nextNode,
        type: "linear",
      });
    }

    // Choice edges
    if (n.type === "choice") {
      (n.choices ?? []).forEach((c, i) => {
        if (c.targetNode) {
          edges.push({
            id:          `${n._id}-choice-${i}`,
            from:        n._id,
            to:          c.targetNode,
            type:        "choice",
            label:       c.label,
            choiceIndex: i,
          });
        }
      });
    }

    // Unlock (AND-gate) edges
    for (const prereqId of n.unlockAfter ?? []) {
      edges.push({
        id:   `${prereqId}-unlock-${n._id}`,
        from: prereqId,
        to:   n._id,
        type: "unlock",
      });
    }
  }

  return {
    nodes:    graphNodes,
    edges,
    metadata: {
      chapterId: chapter._id,
      storyId,
      isDirty:   false,
      version:   Date.now(),
    },
  };
}

// ─── Denormalize: StoryGraph → partial StoryChapter update ───────────────────
// Used when syncing canvas position changes back to the server.
// Edge changes are written immediately via API calls — not batched here.

export function extractPositionsFromGraph(
  graph: StoryGraph,
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  for (const node of graph.nodes) {
    result[node.id] = node.position;
  }
  return result;
}

// ─── Derive nextNode + choices from edges (used in forms) ─────────────────────

export function getNextNodeFromEdges(nodeId: string, edges: GraphEdge[]): string | undefined {
  return edges.find((e) => e.from === nodeId && e.type === "linear")?.to;
}

export function getChoiceEdgesFromNode(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
  return edges
    .filter((e) => e.from === nodeId && e.type === "choice")
    .sort((a, b) => (a.choiceIndex ?? 0) - (b.choiceIndex ?? 0));
}

export function getUnlockEdgesForNode(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
  return edges.filter((e) => e.to === nodeId && e.type === "unlock");
}

// ─── Find a node by id ─────────────────────────────────────────────────────────

export function findGraphNode(graph: StoryGraph, nodeId: string): GraphNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}