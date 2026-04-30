import { StoryProgressView } from "@/modules/story/types/story.types";

export function getNodeStatus(
  nodeId: string,
  progress: StoryProgressView | null | undefined,
): "completed" | "current" | "locked" | "available" {
  if (!progress) return "locked";
  if (progress.completedNodeIds.includes(nodeId)) return "completed";
  if (progress.currentNodeId === nodeId) return "current";
  if (progress.activePath.includes(nodeId)) return "available";
  return "locked";
}
