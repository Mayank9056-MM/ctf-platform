// modules/story/hooks/useGraphEditor.ts
// ─────────────────────────────────────────────────────────────────────────────
// The primary hook consumed by GraphCanvas.tsx.
// Composes:
//   - Server state (TanStack Query)
//   - Graph normalization
//   - Live validation
//   - React Flow state
//   - API mutation handlers
//   - Position persistence
//
// WHY one big hook?
//   The canvas component should be declarative — it receives data and callbacks,
//   it doesn't orchestrate. All the coordination logic lives here.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import {
  useNodesState, useEdgesState, addEdge,
  Node, Edge, Connection, NodeChange, EdgeChange,
  MarkerType,
} from "reactflow";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { debounce } from "lodash";
import { extractPositionsFromGraph, normalizeChapterToGraph } from "../../utils/graph.normalizer";
import { StoryChapter } from "../../types/story.types";
import { useAdminCreateNode } from "./node/useAdminCreateNode";
import { useAdminDeleteNode } from "./node/useAdminDeleteNode";
import { useAdminUpdateNode } from "./node/useAdminUpdateNode";
import { useGraphStore } from "../../store/graph.store";
import { StoryGraph } from "../../types/graph.types";
import { validateGraph } from "../../utils/graph.validation";
import { storyKeys } from "../../queries/story.queries";
import { useAdminStoryDetail } from "./useAdminStoryDetail";





// ─── Edge style by type ───────────────────────────────────────────────────────

const BRANCH_COLORS = ["#34d399", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa"];

export const NODE_CFG = {
  challenge: { color: "#f87171",  bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)"  },
  cutscene:  { color: "#a78bfa",  bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)" },
  briefing:  { color: "#38bdf8",  bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.35)" },
  choice:    { color: "#fbbf24",  bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)" },
} as const;

function buildRFEdge(edge: ReturnType<typeof normalizeChapterToGraph>["edges"][number]): Edge {
  if (edge.type === "linear") {
    const nodeType = edge.id.split("-")[0]; // approximate — caller should pass nodeType
    return {
      id:       edge.id,
      source:   edge.from,
      target:   edge.to,
      type:     "smoothstep",
      animated: true,
      style:    { stroke: "#64748b", strokeWidth: 1.5, strokeDasharray: "4 2" },
      markerEnd:{ type: MarkerType.ArrowClosed, color: "#64748b" },
    };
  }
  if (edge.type === "choice") {
    const color = BRANCH_COLORS[(edge.choiceIndex ?? 0) % BRANCH_COLORS.length];
    return {
      id:           edge.id,
      source:       edge.from,
      sourceHandle: `choice-${edge.choiceIndex ?? 0}`,
      target:       edge.to,
      type:         "smoothstep",
      animated:     true,
      label:        edge.label,
      labelStyle:   { fill: color, fontFamily: "monospace", fontSize: 9, fontWeight: 700 },
      labelBgStyle: { fill: "#0a0e15", fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number],
      style:        { stroke: color, strokeWidth: 2 },
      markerEnd:    { type: MarkerType.ArrowClosed, color },
    };
  }
  // unlock = dashed
  return {
    id:       edge.id,
    source:   edge.from,
    target:   edge.to,
    type:     "smoothstep",
    animated: false,
    style:    { stroke: "#475569", strokeWidth: 1.5, strokeDasharray: "6 3" },
    markerEnd:{ type: MarkerType.ArrowClosed, color: "#475569" },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGraphEditor(storyId: string, chapterId: string) {
  const qc = useQueryClient();
  const { data: story } = useAdminStoryDetail(storyId);

  // Live chapter from server cache
  const chapter = useMemo<StoryChapter | null>(
    () => (story)?.chapters?.find((c) => c._id === chapterId) ?? null,
    [story, chapterId],
  );

  // Mutations
  const { mutate: createNodeMutate } = useAdminCreateNode(storyId, chapterId);
  const { mutate: deleteNodeMutate, isPending: isDeleting } = useAdminDeleteNode(storyId, chapterId);

  // The update node hook is called with a placeholder nodeId — we need to
  // pass the actual nodeId per call, so we use a closure pattern.
  const updateNodeForId = useCallback(
    (nodeId: string) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useAdminUpdateNode(storyId, chapterId, nodeId);
    },
    [storyId, chapterId],
  );

  // We keep a ref to the latest update mutation outside hooks
  // because onConnect fires asynchronously.
  const updateEdgeRef = useRef<(nodeId: string, data) => void>(
    () => toast.error("Graph not ready"),
  );

  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  // Graph store
  const {
    setValidation,
    setPositionsDirty,
    openEditPanel,
    openCreatePanel,
    validation,
    selectedNodeId,
    panelMode,
  } = useGraphStore();

  // Local graph model (normalized)
  const [graph, setGraph] = useState<StoryGraph | null>(null);

  // ── Rebuild React Flow graph when chapter changes ─────────────────────────

  useEffect(() => {
    if (!chapter) return;

    const newGraph = normalizeChapterToGraph(chapter, storyId);
    setGraph(newGraph);

    // Update validation immediately
    const validation = validateGraph(newGraph);
    setValidation(validation);

    // Convert graph edges to RF edges with correct node type colors
    const nodeTypeMap = new Map(newGraph.nodes.map((n) => [n.id, n.type]));

    const rfN: Node[] = newGraph.nodes.map((n) => ({
      id:       n.id,
      type:     "storyNode",
      position: n.position,
      data: {
        node:           n,
        validErrors:    validation.byNode[n.id] ?? [],
        isSelected:     n.id === selectedNodeId,
        onSelect:       openEditPanel,
      },
    }));

    const rfE: Edge[] = newGraph.edges.map((e) => {
      const edge = buildRFEdge(e);
      // Override linear edge color with node's color
      if (e.type === "linear") {
        const nType = nodeTypeMap.get(e.from);
        const color = nType ? NODE_CFG[nType].color : "#64748b";
        edge.style = { stroke: color, strokeWidth: 1.5, strokeDasharray: "4 2" };
        edge.markerEnd = { type: MarkerType.ArrowClosed, color };
      }
      return edge;
    });

    setRfNodes(rfN);
    setRfEdges(rfE);
  }, [chapter, storyId, selectedNodeId, openEditPanel, setValidation]);

  // ── Live validation whenever graph changes ─────────────────────────────────

  useEffect(() => {
    if (!graph) return;
    const result = validateGraph(graph);
    setValidation(result);
  }, [graph, setValidation]);

  // ── Position persistence (debounced 600ms after drag stops) ──────────────

  const persistPositions = useMemo(
    () =>
      debounce((positions: Record<string, { x: number; y: number }>) => {
        // POST /stories/:id/chapters/:chapterId/layout
        // You need to add this endpoint — it saves to storyLayouts collection.
        // Implementation: see README. Non-blocking, failure is cosmetic only.
        fetch(`/api/v1/stories/${storyId}/chapters/${chapterId}/layout`, {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          body:        JSON.stringify({ positions }),
        }).then(() => setPositionsDirty(false)).catch(() => {
          // Silently fail — positions revert on next open but data is safe
        });
      }, 600),
    [storyId, chapterId, setPositionsDirty],
  );

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setGraph((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === node.id ? { ...n, position: node.position } : n,
          ),
          metadata: { ...prev.metadata, isDirty: true },
        };
        persistPositions(extractPositionsFromGraph(updated));
        setPositionsDirty(true);
        return updated;
      });
    },
    [persistPositions, setPositionsDirty],
  );

  // ── Connect handler: drag handle → existing node ──────────────────────────

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || !graph) return;

      const sourceNode = graph.nodes.find((n) => n.id === conn.source);
      if (!sourceNode) return;

      if (sourceNode.type === "choice" && conn.sourceHandle?.startsWith("choice-")) {
        const idx = parseInt(conn.sourceHandle.replace("choice-", ""));
        const choiceData = (sourceNode.data).choices ?? [];
        const updated = choiceData.map((c, i: number) =>
          i === idx ? { ...c, targetNode: conn.target } : c,
        );

        // Optimistic UI
        const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
        setRfEdges((eds) => addEdge({
          ...conn,
          id:           `${conn.source}-choice-${idx}`,
          type:         "smoothstep",
          animated:     true,
          label:        choiceData[idx]?.label ?? "",
          style:        { stroke: color, strokeWidth: 2 },
          markerEnd:    { type: MarkerType.ArrowClosed, color },
        }, eds));

        // Persist
        updateEdgeRef.current(conn.source!, { choices: updated });
        return;
      }

      // Linear edge
      const nodeColor = NODE_CFG[sourceNode.type].color;
      setRfEdges((eds) => addEdge({
        ...conn,
        id:        `${conn.source}-linear`,
        type:      "smoothstep",
        animated:  true,
        style:     { stroke: nodeColor, strokeWidth: 1.5, strokeDasharray: "4 2" },
        markerEnd: { type: MarkerType.ArrowClosed, color: nodeColor },
      }, eds));

      updateEdgeRef.current(conn.source!, { nextNode: conn.target });
    },
    [graph, setRfEdges],
  );

  // ── Connect end: drag to empty space → create node ────────────────────────

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState) => {
      if (!connectionState.isValid) {
        openCreatePanel({
          sourceNodeId: connectionState.fromNode?.id,
          sourceHandle: connectionState.fromHandle?.id,
        });
      }
    },
    [openCreatePanel],
  );

  // ── Delete selected node ──────────────────────────────────────────────────

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const confirmDelete = useCallback(() => {
    if (!deleteTargetId) return;
    deleteNodeMutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null);
        qc.invalidateQueries({ queryKey: storyKeys.admin.detail(storyId) });
      },
    });
  }, [deleteTargetId, deleteNodeMutate, qc, storyId]);

  // ── Nodes in current chapter ──────────────────────────────────────────────

  const sortedNodes = useMemo(
    () => (graph?.nodes ?? []).slice().sort((a, b) => a.order - b.order),
    [graph?.nodes],
  );

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph?.nodes, selectedNodeId],
  );

  return {
    // Graph data
    graph,
    sortedNodes,
    selectedNode,
    chapter,

    // React Flow props
    rfNodes,
    rfEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    handleNodeDragStop,

    // Delete
    deleteTargetId,
    setDeleteTargetId,
    confirmDelete,
    isDeleting,

    // Validation
    validation,

    // Store refs
    updateEdgeRef,

    // Mutations (caller uses these to create/update nodes via side panel)
    createNodeMutate,
  };
}