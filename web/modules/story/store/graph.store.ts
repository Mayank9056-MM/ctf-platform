// modules/story/store/graph.store.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dedicated Zustand store for the graph editor canvas.
// Separate from useStoryStore (which handles list-level admin UI state).
//
// WHY a separate store?
//   The canvas is an isolated subsystem. It has its own state machine:
//   no chapter selected → chapter selected → nodes being edited → validating.
//   Mixing it into useStoryStore creates an impossible tangle.
//
// Architecture:
//   useStoryStore     = admin list page (filter, pagination, etc.)
//   useGraphStore     = editor canvas (selected nodes, panel, traversal)
//   TanStack Query    = server state (chapter data, challenge list)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GraphValidation } from "../types/graph.types";

type PanelMode = "create" | "edit" | "preview" | null;

interface GraphEditorState {
  // ── Active chapter ─────────────────────────────────────────────────────────
  activeChapterId: string | null;
  setActiveChapter: (id: string | null) => void;

  // ── Canvas panel ───────────────────────────────────────────────────────────
  panelMode:         PanelMode;
  selectedNodeId:    string | null;
  openCreatePanel:   (opts?: { sourceNodeId?: string; sourceHandle?: string }) => void;
  openEditPanel:     (nodeId: string) => void;
  openPreviewPanel:  () => void;
  closePanel:        () => void;

  // ── Create panel context (set when dragging from a handle to empty space) ──
  pendingSource: { nodeId: string; handle: string } | null;

  // ── Continuous validation (runs live, not on save) ─────────────────────────
  validation:    GraphValidation | null;
  setValidation: (v: GraphValidation | null) => void;

  // ── Position dirty flag (debounced save pending) ──────────────────────────
  positionsDirty:    boolean;
  setPositionsDirty: (v: boolean) => void;

  // ── Traversal (play-test mode) ─────────────────────────────────────────────
  isTraversalActive: boolean;
  startTraversal:    () => void;
  stopTraversal:     () => void;

  // ── Left sidebar collapse ──────────────────────────────────────────────────
  leftCollapsed:    boolean;
  toggleLeft:       () => void;
  setLeftCollapsed: (v: boolean) => void;
}

export const useGraphStore = create<GraphEditorState>()(
  devtools(
    (set, get) => ({
      // ── Active chapter ──────────────────────────────────────────────────────
      activeChapterId: null,
      setActiveChapter: (id) => set({ activeChapterId: id, selectedNodeId: null, panelMode: null }),

      // ── Panel ───────────────────────────────────────────────────────────────
      panelMode:      null,
      selectedNodeId: null,
      pendingSource:  null,

      openCreatePanel: (opts) => set({
        panelMode:     "create",
        selectedNodeId: null,
        pendingSource: opts ? { nodeId: opts.sourceNodeId ?? "", handle: opts.sourceHandle ?? "" } : null,
      }),

      openEditPanel: (nodeId) => set({
        panelMode:     "edit",
        selectedNodeId: nodeId,
        pendingSource: null,
      }),

      openPreviewPanel: () => set({
        panelMode:     "preview",
        selectedNodeId: null,
        pendingSource: null,
      }),

      closePanel: () => set({
        panelMode:     null,
        selectedNodeId: null,
        pendingSource:  null,
      }),

      // ── Validation ──────────────────────────────────────────────────────────
      validation:    null,
      setValidation: (v) => set({ validation: v }),

      // ── Position dirty ──────────────────────────────────────────────────────
      positionsDirty:    false,
      setPositionsDirty: (v) => set({ positionsDirty: v }),

      // ── Traversal ───────────────────────────────────────────────────────────
      isTraversalActive: false,
      startTraversal:    () => set({ isTraversalActive: true, panelMode: "preview" }),
      stopTraversal:     () => set({ isTraversalActive: false, panelMode: null }),

      // ── Sidebar ─────────────────────────────────────────────────────────────
      leftCollapsed:    false,
      toggleLeft:       () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
      setLeftCollapsed: (v) => set({ leftCollapsed: v }),
    }),
    { name: "GraphEditorStore" },
  ),
);