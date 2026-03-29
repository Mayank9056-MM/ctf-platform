import { useRouter } from "next/navigation";
import { registerApi } from "../api/auth.api";
import { RegisterFormData } from "../validation/auth.validator";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-error";
import { showErrorToast } from "@/shared/utils/show-error-toast";

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterFormData) => registerApi(data),
    onSuccess: (res) => {
      const hasLocalProvider = res.data.providers.some(
        (p) => p.provider === "local",
      );

      // If local account → needs email verification → go to login
      if (hasLocalProvider) {
        toast.success("Account created! Check your inbox.", {
          id: "register-success",
          duration: 6000,
          description: "Verify your email to unlock all platform features.",
        });
        router.push("/login?registered=true");
      } else {
        toast.success(`Welcome aboard, ${res.data.username}!`);
        router.push("/dashboard");
      }
    },
    onError: (err: ApiError) => {
      const status = err.statusCode;

      if (status === 409) {
        toast.error("An account with this email already exists.", {
          description: "Try signing in instead.",
          action: { label: "Sign in", onClick: () => router.push("/login") },
        });
      } else if (status === 413) {
        toast.error("Avatar file too large. Maximum is 5 MB.");
      } else if (status === 415) {
        toast.error("Unsupported avatar format. Use JPEG, PNG, or WEBP.");
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    },
  });
};
