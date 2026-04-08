import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginFormData } from "../schema/auth.schema";
import { loginApi, resendVerificationApi } from "../api/auth.api";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

type LoginVariables = LoginFormData & {
  from?: string | null;
};

export const useLogin = () => {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginVariables) => loginApi(data),
    onSuccess: (res, variables) => {
      setUser(res.data);
      queryClient.setQueryData(["auth", "me"], res.data);
      toast.success(`Welcome back, ${res.data.username}! 🎯`);
      const from = variables.from;
      const dest =
        from && from.startsWith("/") && from !== "/login" ? from : "/dashboard";
      router.push(dest);
      router.refresh();
    },
    onError: (err: ApiError) => {
      const status = err.statusCode;
      const msg = err.message?.toLowerCase() ?? "";
      if (status === 400 || status === 401) {
        toast.error("Incorrect email or password.");
      } else if (status === 403) {
        if (msg.includes("ban") || msg.includes("suspend")) {
          toast.error("Your account has been suspended.", {
            description: "Contact support: support@ctfplatform.io",
            duration: 10_000,
          });
        } else if (msg.includes("verif")) {
          toast.error("Please verify your email before signing in.", {
            action: {
              label: "Resend email",
              onClick: () =>
                resendVerificationApi().then(() =>
                  toast.success("Verification email sent!"),
                ),
            },
            duration: 8000,
          });
        } else {
          toast.error(err.message || "Access denied.");
        }
      } else if (status === 429) {
        toast.error("Too many failed attempts. Account temporarily locked.", {
          description: "Try again in 15 minutes or reset your password.",
          action: {
            label: "Reset password",
            onClick: () => router.push("/forgot-password"),
          },
          duration: 10_000,
        });
      } else {
        toast.error(err.message || "Sign in failed. Please try again.");
      }
    },
  });
};
