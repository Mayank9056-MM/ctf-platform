import { useRouter } from "next/navigation";
import { resetPasswordApi } from "../api/auth.api";
import { ResetPasswordInput } from "../types/auth.types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordInput) => resetPasswordApi(data),
    onSuccess: () => {
      toast.success("Password reset successfully. Please sign in.", {
        duration: 6000,
      });
      // Small delay so the success state is visible before redirect
      setTimeout(() => router.push("/login"), 1800);
    },
    onError: (err: ApiError) => {
      if (err.statusCode === 400 || err.statusCode === 404) {
        toast.error("Reset link is invalid or has expired.", {
          description: "Please request a new one.",
          duration: 8000,
        });
      } else if (err.statusCode === 429) {
        toast.error("Too many attempts. Please wait before trying again.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });
};
