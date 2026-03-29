import { useMutation } from "@tanstack/react-query";
import { forgotPasswordApi } from "../api/auth.api";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-error";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
    onSuccess: () => {
      toast.success("If that email exists, reset instructions were sent.", {
        description: "Check spam if you don't see it within 2 minutes.",
        duration: 8000,
      });
    },
    onError: (err: ApiError) => {
      if (err.statusCode === 429) {
        toast.error("Too many reset requests. Try again in 15 minutes.");
      } else {
        // Intentionally vague to avoid email enumeration
        toast.success("If that email exists, reset instructions were sent.", {
          duration: 6000,
        });
      }
    },
  });
};
