import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginFormData } from "../validation/auth.validator";
import { loginApi } from "../api/auth.api";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export const useLogin = () => {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginFormData) => loginApi(data),
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(["auth", "me"], res.data);
      toast.success(`Welcome back, ${res.data.username}!`);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 403) {
        toast.error("Account suspended. Contact support.");
      } else if (status === 429) {
        toast.error("Too many login attempts. Try again in 15 minutes.");
      } else {
        toast.error(err.message ?? "Invalid credentials.");
      }
    },
  });
};
