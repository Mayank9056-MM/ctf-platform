import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { adminKeys } from "../../queries/admin.queries";
import { AdminUpdateUserFormData } from "../../schema/admin.schema";
import { adminUpdateUserApi } from "../../api/admin.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to update a user by ID from the API.
 *
 * @param {string} userId - ID of the user to update.
 *
 * @returns {useMutation} - A react-query hook to update the user.
 *
 * @example
 * const { data, error, isLoading } = useAdminUpdateUser("1234567890abcdef");
 */
export function useAdminUpdateUser(userId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminUpdateUserFormData) =>
      adminUpdateUserApi(userId, payload),

    onSuccess: (user) => {
      qc.setQueryData(adminKeys.users.detail(userId), user);
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success("User updated.");
    },

    onError: (err: ApiError) => {
      if (err.statusCode === 409)
        toast.error("Username or email already in use.");
      else toast.error(err.message ?? "Failed to update user.");
    },
  });
}
