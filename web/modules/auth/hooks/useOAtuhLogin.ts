import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutApi } from "../api/auth.api";
import { toast } from "sonner";

export const useLogout = () => {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success("Logged out successfully.");
      router.push("/login");
      router.refresh();
    },
    onError: () => {
      // Force logout on client even if server fails
      logout();
      queryClient.clear();
      router.push("/login");
    },
  });
};
