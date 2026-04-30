// modules/story/types/graph.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// The frontend graph model is a NORMALIZED version of the backend's embedded
// subdocument schema. The backend stores everything in one chapter document.
// The frontend works with a clean adjacency structure that maps 1:1 to
// React Flow's node/edge primitives.
//
// WHY separate types?
//   - Backend: StoryNode has nextNode, choices[], unlockAfter[] scattered
//   - Frontend: GraphEdge unifies all three into one concept
//   - This lets validation, rendering, traversal all operate on one model
// ─────────────────────────────────────────────────────────────────────────────

import type { StoryNodeType } from "./story.types";

// ─── Node data (type-specific payload) ────────────────────────────────────────

export type ChallengeNodeData = {
  challengeId: string;
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
};

export type CutsceneNodeData = {
  content: string;
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
};

export type BriefingNodeData = {
  content: string;
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
};

export type ChoiceNodeData = {
  choices: { label: string; description?: string; targetNode?: string }[];
  preNarrative?: string;
  postNarrative?: string;
  characterId?: string;
};

export type NodeData =
  | ChallengeNodeData
  | CutsceneNodeData
  | BriefingNodeData
  | ChoiceNodeData;

// ─── Graph node ────────────────────────────────────────────────────────────────

export type GraphNode = {
  id:           string;          // = MongoDB _id
  type:         StoryNodeType;
  order:        number;
  isEntryPoint: boolean;
  isOptional:   boolean;
  xpBonus:      number;
  data:         NodeData;
  position:     { x: number; y: number };
};

// ─── Graph edge ────────────────────────────────────────────────────────────────

export type GraphEdgeType = "linear" | "choice" | "unlock";

export type GraphEdge = {
  id:            string;
  from:          string;   // nodeId
  to:            string;   // nodeId
  type:          GraphEdgeType;
  label?:        string;   // for choice edges: the choice label
  choiceIndex?:  number;   // for choice edges: which choice
};

// ─── Full graph ────────────────────────────────────────────────────────────────

export type StoryGraph = {
  nodes:    GraphNode[];
  edges:    GraphEdge[];
  metadata: {
    chapterId:   string;
    storyId:     string;
    isDirty:     boolean;   // positions changed but not saved
    version:     number;
  };
};

// ─── Validation ────────────────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationError = {
  nodeId?:   string;             // undefined = global error
  edgeId?:   string;
  severity:  ValidationSeverity;
  code:      string;
  message:   string;
};

export type GraphValidation = {
  isValid:  boolean;             // true only if no "error" severity items
  errors:   ValidationError[];
  byNode:   Record<string, ValidationError[]>;   // nodeId → errors
};

// ─── Traversal (play test) ─────────────────────────────────────────────────────

export type TraversalState = {
  currentNodeId:  string;
  completedIds:   Set<string>;
  bypassedIds:    Set<string>;
  path:           string[];
  choicesMade:    { nodeId: string; choiceLabel: string; toNodeId: string }[];
};

export type TraversalEvent =
  | { type: "advance";  nextNodeId: string }
  | { type: "choice";   choices: { label: string; edgeId: string }[] }
  | { type: "terminal" }
  | { type: "complete" }
  | { type: "error";   message: string };

// ─── Position store ────────────────────────────────────────────────────────────

export type CanvasPositions = Record<string, { x: number; y: number }>;