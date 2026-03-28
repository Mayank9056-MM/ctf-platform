import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { githubOAuthApi } from "../api/auth.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGithubCallback = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  return useMutation({
    mutationFn: githubOAuthApi,
    onSuccess: (res) => {
      setUser(res.data);

      toast.success(`Welcome back, ${res.data.username}!`);
      router.push("/dashboard");
      router.refresh();
    },
    onError: () => {
      toast.error("GitHub sign-in failed. Try again.");
      router.push("/login");
    },
  });
};
