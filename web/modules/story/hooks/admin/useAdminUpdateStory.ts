import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { storyKeys } from "../../queries/story.queries";
import { UpdateStoryFormData } from "../../schemas/story.schema";
import { adminUpdateStoryApi } from "../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminUpdateStory(storyId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: UpdateStoryFormData) =>
      adminUpdateStoryApi(storyId, payload),
 
    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      qc.invalidateQueries({ queryKey: storyKeys.admin.lists() });
      toast.success("Story updated.");
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to update story.");
    },
  });
}
