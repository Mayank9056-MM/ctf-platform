import { ApiError } from "next/dist/server/api-utils";
import { adminKeys } from "../../queries/admin.queries";
import { toast } from "sonner";
import { adminUnbanUserApi } from "../../api/admin.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to unban a user by ID from the API.
 *
 * @param {string} userId - ID of the user to unban.
 *
 * @returns {useMutation} - A react-query hook to unban the user.
 *
 * @example
 * const { data, error, isLoading } = useAdminUnbanUser("1234567890abcdef");
 */
export function useAdminUnbanUser(userId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: () => adminUnbanUserApi(userId),
 
    onSuccess: (user) => {
      qc.setQueryData(adminKeys.users.detail(userId), user);
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success(`${user.username} has been unbanned.`);
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to unban user.");
    },
  });
}
 