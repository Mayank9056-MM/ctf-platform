import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { storyKeys } from "../../queries/story.queries";
import { adminDeleteStoryApi } from "../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminDeleteStory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeleteStoryApi(id),

    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: storyKeys.admin.detail(id) });
      qc.invalidateQueries({ queryKey: storyKeys.admin.lists() });
      qc.invalidateQueries({ queryKey: storyKeys.lists() });
      toast.success("Story deleted.");
    },

    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to delete story.");
    },
  });
}
