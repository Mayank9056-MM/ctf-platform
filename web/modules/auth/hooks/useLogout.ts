import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logoutApi } from "../api/auth.api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();

      toast.success("Signed out. See you next time! 👋", { id: "logout" });
      router.push("/login");
      router.refresh();
    },
    onError: () => {
      logout();
      queryClient.clear();
      router.push("/login");
    },
  });
};
