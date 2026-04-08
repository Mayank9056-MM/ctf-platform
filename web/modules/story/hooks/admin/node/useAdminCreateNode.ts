import { adminCreateNodeApi } from "@/modules/story/api/story.api";
import { storyKeys } from "@/modules/story/queries/story.queries";
import { CreateNodeFormData } from "@/modules/story/schemas/story.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useAdminCreateNode(storyId: string, chapterId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNodeFormData) =>
      adminCreateNodeApi(storyId, chapterId, payload),

    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      // Invalidate validation — graph changed
      qc.removeQueries({
        queryKey: storyKeys.admin.validate(storyId, chapterId),
      });
      toast.success("Node created.");
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to create node.");
    },
  });
}
