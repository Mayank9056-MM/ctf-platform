import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleOAuthApi } from "../api/auth.api";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export const useGoogleAuth = () => {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (token: string) =>
      googleOAuthApi({ provider: "google", token }),
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(["auth", "me"], res.data);
      toast.success(`Welcome, ${res.data.username}!`);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Google sign-in failed. Try again.");
    },
  });
};