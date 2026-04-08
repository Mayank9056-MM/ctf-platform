import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { storyKeys } from "../../queries/story.queries";
import { SetStoryStatusFormData } from "../../schemas/story.schema";
import { adminSetStoryStatusApi } from "../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminSetStoryStatus(storyId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetStoryStatusFormData) =>
      adminSetStoryStatusApi(storyId, payload),

    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      qc.invalidateQueries({ queryKey: storyKeys.admin.lists() });
      // Player list also needs refreshing when a story is published/archived
      qc.invalidateQueries({ queryKey: storyKeys.lists() });
      toast.success(`Story status set to "${story.status}".`);
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to update status.");
    },
  });
}
