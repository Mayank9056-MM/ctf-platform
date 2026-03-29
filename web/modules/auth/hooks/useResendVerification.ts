import { useMutation } from "@tanstack/react-query";
import { resendVerificationApi } from "../api/auth.api";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export const useResendVerification = () => {
  return useMutation({
    mutationFn: resendVerificationApi,
    onSuccess: () => {
      toast.success("Verification email sent!", {
        description: "Check your inbox — it may take a minute.",
        duration: 6000,
      });
    },
    onError: (err: ApiError) => {
      if (err.statusCode === 429) {
        toast.error(
          "Please wait before requesting another verification email.",
        );
      } else if (err.statusCode === 409) {
        toast.info("Your email is already verified. You can sign in now.");
      } else {
        toast.error("Could not send verification email. Try again later.");
      }
    },
  });
};
