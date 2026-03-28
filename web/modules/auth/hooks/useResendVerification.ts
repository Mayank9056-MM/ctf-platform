import { useMutation } from "@tanstack/react-query";
import { resendVerificationApi } from "../api/auth.api";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export const useResendVerification = () => {
  return useMutation({
    mutationFn: resendVerificationApi,
    onSuccess: () => {
      toast.success("Verification email sent! Check your inbox.", {
        duration: 5000,
      });
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Could not send verification email.");
    },
  });
};
 