import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logoutApi } from "../api/auth.api";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["currentUser"] });

      toast.success("Logged out");

      window.location.href = "/login";
    },
  });
};
