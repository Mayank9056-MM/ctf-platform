import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { storyKeys } from "../../queries/story.queries";
import { adminCreateStoryApi } from "../../api/story.api";
import { CreateStoryFormData } from "../../schemas/story.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminCreateStory() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: CreateStoryFormData) => adminCreateStoryApi(payload),
 
    onSuccess: (story) => {
      qc.invalidateQueries({ queryKey: storyKeys.admin.lists() });
      toast.success(`"${story.title}" created as draft.`);
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to create story.");
    },
  });
}