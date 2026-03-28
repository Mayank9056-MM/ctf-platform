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

      toast.success("Account created! Check your email to verify.", {
        duration: 5000,
      });

      // If local account → needs email verification → go to login
      if (hasLocalProvider) {
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (err: ApiError) => {
      const status = err.statusCode;

      if (status === 409) {
        toast.error("Email already exists. Try logging in.");
      } else if (status === 400) {
        toast.error("Invalid input. Check your details.");
      } else if (status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        showErrorToast(err);
      }
    },
  });
};
