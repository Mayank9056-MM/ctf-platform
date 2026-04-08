import { adminUpdateNodeApi } from "@/modules/story/api/story.api";
import { storyKeys } from "@/modules/story/queries/story.queries";
import { UpdateNodeFormData } from "@/modules/story/schemas/story.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useAdminUpdateNode(
  storyId: string,
  chapterId: string,
  nodeId: string,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNodeFormData) =>
      adminUpdateNodeApi(storyId, chapterId, nodeId, payload),

    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      qc.removeQueries({
        queryKey: storyKeys.admin.validate(storyId, chapterId),
      });
      toast.success("Node updated.");
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to update node.");
    },
  });
}
