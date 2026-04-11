import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { challengeKeys } from "../../queries/challenge.keys";
import { adminRemoveAttachmentApi } from "../../api/challenges.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRemoveAttachment(challengeId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      adminRemoveAttachmentApi(challengeId, attachmentId),

    onSuccess: (challenge) => {
      qc.setQueryData(challengeKeys.detail(challenge.slug), challenge);
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      toast.success("Attachment removed.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 404) {
        toast.error("Attachment not found.");
      } else {
        toast.error(err.message ?? "Failed to remove attachment.");
      }
    },
  });
}
