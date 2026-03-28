import { useMutation } from "@tanstack/react-query";
import { forgotPasswordApi } from "../api/auth.api";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-error";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
    onSuccess: () => {
      toast.success(
        "If an account exists with that email, you'll receive reset instructions.",
        { duration: 6000 },
      );
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Something went wrong. Try again.");
    },
  });
};
