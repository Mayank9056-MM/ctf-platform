import { ApiError } from "next/dist/server/api-utils";
import { storyKeys } from "../../queries/story.queries";
import { toast } from "sonner";
import { adminRemoveCharacterApi } from "../../api/story.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminRemoveCharacter(storyId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (characterId: string) =>
      adminRemoveCharacterApi(storyId, characterId),
 
    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      toast.success("Character removed.");
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to remove character.");
    },
  });
}