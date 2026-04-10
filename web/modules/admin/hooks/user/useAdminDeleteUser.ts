import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { adminKeys } from "../../queries/admin.queries";
import { adminDeleteUserApi } from "../../api/admin.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to delete a user by ID from the API.
 *
 * @returns {useMutation} - A react-query hook to delete the user.
 *
 * @example
 * const { data, error, isLoading } = useAdminDeleteUser("1234567890abcdef");
 */
export function useAdminDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminDeleteUserApi(userId),

    onSuccess: (_, userId) => {
      qc.removeQueries({ queryKey: adminKeys.users.detail(userId) });
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success("User deleted and PII anonymised.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 403)
        toast.error("Cannot delete your own account.");
      else toast.error(err.message ?? "Failed to delete user.");
    },
  });
}
