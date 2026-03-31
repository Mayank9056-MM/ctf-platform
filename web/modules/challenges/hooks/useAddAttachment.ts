import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAddAttachmentApi } from "../api/challenges.api";
import { challengeKeys } from "../queries/challenge.keys";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useAddAttachment(challengeId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => adminAddAttachmentApi(challengeId, file, onProgress),
 
    onSuccess: (challenge) => {
      qc.setQueryData(challengeKeys.detail(challenge.slug), challenge);
      qc.invalidateQueries({ queryKey: challengeKeys.admin.lists() });
      toast.success("Attachment uploaded.");
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 413) {
        toast.error("File too large. Maximum size exceeded.");
      } else if (err.statusCode === 415) {
        toast.error("Unsupported file type.");
      } else {
        toast.error(err.message ?? "Upload failed.");
      }
    },
  });
}