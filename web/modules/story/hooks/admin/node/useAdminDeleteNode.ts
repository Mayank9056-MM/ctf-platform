import { adminDeleteNodeApi } from "@/modules/story/api/story.api";
import { storyKeys } from "@/modules/story/queries/story.queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useAdminDeleteNode(storyId: string, chapterId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (nodeId: string) =>
      adminDeleteNodeApi(storyId, chapterId, nodeId),
 
    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      qc.removeQueries({ queryKey: storyKeys.admin.validate(storyId, chapterId) });
      toast.success("Node deleted.");
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to delete node.");
    },
  });
}
 