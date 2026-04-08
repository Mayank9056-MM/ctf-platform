import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddCharacterFormData } from "../../schemas/story.schema";
import { adminAddCharacterApi } from "../../api/story.api";
import { storyKeys } from "../../queries/story.queries";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export function useAdminAddCharacter(storyId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddCharacterFormData) =>
      adminAddCharacterApi(storyId, payload),

    onSuccess: (story) => {
      qc.setQueryData(storyKeys.admin.detail(storyId), story);
      toast.success(`Character "${story.characters.at(-1)?.name}" added.`);
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 409)
        toast.error("A character with this ID already exists.");
      else toast.error(err.message ?? "Failed to add character.");
    },
  });
}
