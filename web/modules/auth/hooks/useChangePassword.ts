import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChangePasswordInput } from "../types/auth.types";
import { toast } from "sonner";
import { changePasswordApi } from "../api/auth.api";
import { ApiError } from "next/dist/server/api-utils";

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangePasswordInput) => changePasswordApi(data),
    onSuccess: () => {
      toast.success("Password changed successfully.", {
        description:
          "Other active sessions have been signed out for your security.",
        duration: 6000,
      });
      // Invalidate current user in case the server rotates the session
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (err: ApiError) => {
      if (err.statusCode === 401) {
        toast.error("Current password is incorrect.");
      } else if (err.statusCode === 400) {
        toast.error(err.message ?? "Invalid request. Please check your input.");
      } else if (err.statusCode === 429) {
        toast.error("Too many attempts. Please wait before trying again.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });
};
